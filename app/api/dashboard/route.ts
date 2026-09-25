import { connectToDatabase } from "@/lib/db/mongodb";
import { requirePermission } from "@/lib/auth/guard";
import { handleError, ok } from "@/lib/api";
import { Project } from "@/models/Project";
import { Task } from "@/models/Task";
import { AuditLog } from "@/models/AuditLog";
import { Operational } from "@/models/Operational";
import { Material } from "@/models/Material";
import { Equipment } from "@/models/Equipment";
import { Payment } from "@/models/Payment";
import { Expense } from "@/models/Expense";
import { Milestone } from "@/models/Milestone";
import { hasPermission } from "@/lib/rbac/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const isProjectActive = (status?: string): boolean => {
  if (!status) return false;
  const s = status.trim().toLowerCase();
  return s === "active" || s === "in_progress" || s === "in-progress" || s === "underway";
};

const isProjectCompleted = (status?: string): boolean => {
  if (!status) return false;
  const s = status.trim().toLowerCase();
  return s === "completed" || s === "done" || s === "closed";
};

const isProjectDelayed = (status?: string, health?: string): boolean => {
  const s = (status || "").trim().toLowerCase();
  const h = (health || "").trim().toUpperCase();
  return s === "delayed" || h === "DELAYED" || h === "CRITICAL";
};

export async function GET(request: Request) {
  const guard = await requirePermission("PROJECT_VIEW", request);
  if (guard.error) return guard.error;

  try {
    await connectToDatabase();
    const access =
      guard.user.role === "Admin"
        ? {}
        : { $or: [{ projectManager: guard.user.id }, { teamMembers: guard.user.id }] };

    // 1. Fetch Projects
    const projects = await Project.find(access).populate("projectManager", "fullName").lean();
    const projectIds = projects.map((p) => p._id);

    // 2. Fetch parallel auxiliary collections
    const [
      taskRows,
      recentActivities,
      materialsList,
      equipmentList,
      paymentList,
      expenseList,
      milestoneList,
      operations,
    ] = await Promise.all([
      Task.find({ projectId: { $in: projectIds } })
        .populate("assignedTo", "fullName")
        .populate("projectId", "name projectCode")
        .sort({ dueDate: 1 })
        .limit(20)
        .lean(),
      AuditLog.find({ projectId: { $in: projectIds } })
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      hasPermission(guard.user, "INVENTORY_VIEW")
        ? Material.find({}).sort({ currentStock: 1 }).limit(10).lean()
        : Promise.resolve([]),
      hasPermission(guard.user, "EQUIPMENT_VIEW")
        ? Equipment.find(
            guard.user.role === "Admin" ? {} : { assignedProjectId: { $in: projectIds } }
          ).lean()
        : Promise.resolve([]),
      Payment.find({ projectId: { $in: projectIds } })
        .populate("projectId", "name projectCode")
        .sort({ paymentDate: -1 })
        .limit(6)
        .lean(),
      Expense.find({ projectId: { $in: projectIds } })
        .populate("projectId", "name projectCode")
        .sort({ date: -1 })
        .limit(6)
        .lean(),
      Milestone.find({ projectId: { $in: projectIds } })
        .populate("projectId", "name projectCode")
        .sort({ dueDate: 1 })
        .limit(10)
        .lean(),
      Operational.find({ projectId: { $in: projectIds } })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
    ]);

    // 3. Financial calculations
    const totalBudget = projects.reduce(
      (sum, p) => sum + Number(p.revisedBudget ?? p.totalBudget ?? 0),
      0
    );

    // Project value / contract value
    const totalProjectValue = projects.reduce((sum, p) => {
      const val = Number(p.contractValue || p.revisedBudget || p.totalBudget || 0);
      return sum + val;
    }, 0);

    // Total expenses: prioritize sum of actual Expense records if present, else sum of amountSpent on projects
    const totalRecordedExpenses = expenseList.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const totalProjectAmountSpent = projects.reduce(
      (sum, p) => sum + Number(p.amountSpent || 0),
      0
    );
    const totalExpenses =
      totalRecordedExpenses > 0 ? totalRecordedExpenses : totalProjectAmountSpent;

    const remainingBudget = Math.max(0, totalBudget - totalExpenses);
    const budgetUsedPercentage =
      totalBudget > 0 ? Math.round((totalExpenses / totalBudget) * 100) : 0;

    // 4. Overall Progress (weighted by budget/value for accuracy)
    let overallProgress = 0;
    if (projects.length > 0) {
      const totalWeight = projects.reduce(
        (sum, p) => sum + Number(p.revisedBudget ?? p.totalBudget ?? 1),
        0
      );
      if (totalWeight > 0) {
        const weighted = projects.reduce((sum, p) => {
          const w = Number(p.revisedBudget ?? p.totalBudget ?? 1);
          return sum + Number(p.progressPercentage || 0) * w;
        }, 0);
        overallProgress = Math.round((weighted / totalWeight) * 10) / 10;
      } else {
        const sumProg = projects.reduce((sum, p) => sum + Number(p.progressPercentage || 0), 0);
        overallProgress = Math.round((sumProg / projects.length) * 10) / 10;
      }
    }

    // 5. Active, completed, delayed project counts
    const activeProjectsCount = projects.filter((p) => isProjectActive(p.status)).length;
    const completedProjectsCount = projects.filter((p) => isProjectCompleted(p.status)).length;
    const delayedProjectsCount = projects.filter((p) =>
      isProjectDelayed(p.status, p.healthStatus)
    ).length;

    // 6. Tasks breakdown
    const completedTasks = taskRows.filter((t) => t.status === "COMPLETED").length;
    const inProgressTasks = taskRows.filter(
      (t) => t.status === "IN_PROGRESS" || t.status === "IN-PROGRESS"
    ).length;
    const overdueTasks = taskRows.filter(
      (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "COMPLETED"
    ).length;
    const blockedTasks = taskRows.filter((t) => t.status === "BLOCKED").length;

    // 7. Equipment Fleet metrics
    const totalEquipment = equipmentList.length;
    const availableEquipment = equipmentList.filter((e) => e.status === "AVAILABLE").length;
    const inUseEquipment = equipmentList.filter((e) => e.status === "IN_USE").length;
    const maintenanceEquipment = equipmentList.filter((e) => e.status === "MAINTENANCE").length;
    const equipmentUtilization =
      totalEquipment > 0 ? Math.round((inUseEquipment / totalEquipment) * 100) : 0;

    // 8. Upcoming Deadlines combined from Tasks & Milestones
    const now = Date.now();
    const taskDeadlines = taskRows
      .filter((t) => t.dueDate && t.status !== "COMPLETED")
      .map((t) => {
        const due = new Date(t.dueDate as unknown as string).getTime();
        const remainingDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
        return {
          id: String(t._id),
          title: t.title,
          dueDate: t.dueDate,
          remainingDays,
          kind: "Task",
          projectName: (t.projectId as any)?.name || "General",
          status: t.status,
          projectId: String((t.projectId as any)?._id || t.projectId || ""),
        };
      });

    const milestoneDeadlines = milestoneList
      .filter((m) => m.dueDate && m.status !== "Completed")
      .map((m) => {
        const due = new Date(m.dueDate as unknown as string).getTime();
        const remainingDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
        return {
          id: String(m._id),
          title: m.title,
          dueDate: m.dueDate,
          remainingDays,
          kind: "Milestone",
          projectName: (m.projectId as any)?.name || "General",
          status: m.status,
          projectId: String((m.projectId as any)?._id || m.projectId || ""),
        };
      });

    const allDeadlines = [...taskDeadlines, ...milestoneDeadlines]
      .sort((a, b) => new Date(a.dueDate as any).getTime() - new Date(b.dueDate as any).getTime())
      .slice(0, 8);

    // 9. Normalized Project list
    const projectItems = projects.map((p) => {
      const budgetVal = Number(p.revisedBudget ?? p.totalBudget ?? 0);
      const spentVal = Number(p.amountSpent ?? 0);
      const progVal = Number(p.progressPercentage ?? 0);
      return {
        id: String(p._id),
        name: p.name,
        projectCode: p.projectCode || `PRJ-${String(p._id).slice(-4).toUpperCase()}`,
        client: p.client || (p as any).clientName || "Corporate Client",
        location: p.location || "Addis Ababa, Ethiopia",
        manager:
          (p.projectManager as unknown as { fullName?: string } | null)?.fullName || "Unassigned",
        startDate: p.startDate ? new Date(p.startDate).toISOString() : "",
        endDate: p.expectedEndDate ? new Date(p.expectedEndDate).toISOString() : "",
        budget: budgetVal,
        expenses: spentVal,
        progress: progVal,
        status: p.status || "Active",
        health: p.healthStatus || (progVal >= 80 ? "ON_TRACK" : progVal < 20 ? "AT_RISK" : "ON_TRACK"),
      };
    });

    // 10. Return response
    return ok({
      activeProjects: activeProjectsCount,
      totalProjects: projects.length,
      completedProjects: completedProjectsCount,
      delayedProjects: delayedProjectsCount,
      totalProjectValue,
      totalBudget,
      totalExpenses,
      remainingBudget,
      budgetUsedPercentage,
      overallProgress,
      projects: {
        total: projects.length,
        active: activeProjectsCount,
        completed: completedProjectsCount,
        delayed: delayedProjectsCount,
        items: projectItems,
      },
      financial: {
        contractValue: totalProjectValue,
        budget: totalBudget,
        expenses: totalExpenses,
        remaining: remainingBudget,
        budgetUsedPercentage,
        committedCost: projects.reduce((sum, p) => sum + Number(p.committedCost || 0), 0),
      },
      materials: {
        items: materialsList.map((m) => ({
          id: String(m._id),
          name: m.name,
          sku: m.sku,
          category: m.category,
          unit: m.unitOfMeasure,
          currentStock: m.currentStock || 0,
          minimumStock: m.minimumStockLevel || 0,
          unitCost: m.unitCost || 0,
          status:
            (m.currentStock || 0) <= (m.minimumStockLevel || 0)
              ? "LOW_STOCK"
              : "IN_STOCK",
        })),
        totalCount: materialsList.length,
        lowStockCount: materialsList.filter(
          (m) => (m.currentStock || 0) <= (m.minimumStockLevel || 0)
        ).length,
      },
      equipment: {
        total: totalEquipment,
        available: availableEquipment,
        inUse: inUseEquipment,
        maintenance: maintenanceEquipment,
        utilization: equipmentUtilization,
        items: equipmentList.slice(0, 6).map((e) => ({
          id: String(e._id),
          name: e.name,
          equipmentCode: e.equipmentCode,
          category: e.category,
          status: e.status,
        })),
      },
      tasks: {
        total: taskRows.length,
        completed: completedTasks,
        inProgress: inProgressTasks,
        overdue: overdueTasks,
        blocked: blockedTasks,
        items: taskRows.slice(0, 6).map((t) => ({
          id: String(t._id),
          title: t.title,
          projectName: (t.projectId as any)?.name || "General",
          assignedTo: (t.assignedTo as any)?.fullName || "Unassigned",
          priority: t.priority || "MEDIUM",
          status: t.status || "NOT_STARTED",
          dueDate: t.dueDate,
          progress: t.progress || 0,
        })),
      },
      payments: paymentList.length > 0
        ? paymentList.map((p) => ({
            id: String(p._id),
            paymentNumber: p.paymentNumber,
            projectName: (p.projectId as any)?.name || "General",
            amount: p.amount,
            currency: p.currency || "ETB",
            paymentDate: p.paymentDate,
            paymentMethod: p.paymentMethod,
            status: "Completed",
          }))
        : expenseList.map((e) => ({
            id: String(e._id),
            paymentNumber: e.expenseNumber,
            projectName: (e.projectId as any)?.name || "General",
            amount: e.amount,
            currency: e.currency || "ETB",
            paymentDate: e.date,
            paymentMethod: e.paymentMethod,
            status: e.status,
          })),
      deadlines: allDeadlines,
      recentActivities,
    });
  } catch (error) {
    return handleError(error);
  }
}
