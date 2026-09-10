import { connectToDatabase } from "@/lib/db/mongodb";
import { requirePermission } from "@/lib/auth/guard";
import { handleError, ok } from "@/lib/api";
import { Project } from "@/models/Project";
import { Task } from "@/models/Task";
import { AuditLog } from "@/models/AuditLog";
import { Operational } from "@/models/Operational";
import { percentage } from "@/lib/formatters/currency";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const guard = await requirePermission("PROJECT_VIEW", request);
  if (guard.error) return guard.error;

  try {
    await connectToDatabase();
    const access =
      guard.user.role === "Admin"
        ? {}
        : { $or: [{ projectManager: guard.user.id }, { teamMembers: guard.user.id }] };

    const projects = await Project.find(access).populate("projectManager", "fullName").lean();
    const projectIds = projects.map((p) => p._id);

    const [taskRows, recentActivities, operations] = await Promise.all([
      Task.find({ projectId: { $in: projectIds } }).select("projectId title status dueDate priority").lean(),
      AuditLog.find({ projectId: { $in: projectIds } })
        .sort({ createdAt: -1 })
        .limit(8).lean(),
      Operational.find({ projectId: { $in: projectIds } }).sort({ createdAt: -1 }).limit(100).lean(),
    ]);

    const totalBudget = projects.reduce((sum, p) => sum + Number(p.revisedBudget ?? p.totalBudget ?? 0), 0);
    const totalSpent = projects.reduce((sum, p) => sum + Number(p.amountSpent || 0), 0);
    const contractValue = projects.reduce((sum, p) => sum + Number(p.contractValue || 0), 0);
    const completedTasks = taskRows.filter((task) => task.status === "COMPLETED").length;
    const overdueTasks = taskRows.filter((task) => task.dueDate && task.dueDate < new Date() && task.status !== "COMPLETED").length;
    const pendingTasks = taskRows.length - completedTasks;
    const byKind = (kind: string) => operations.filter((record) => record.kind === kind);
    const procurement = byKind("procurement");
    const materials = byKind("materials");
    const issues = byKind("issues");
    const deadlines = [...taskRows.filter((task) => task.dueDate && task.status !== "COMPLETED").map((task) => ({ title: task.title, dueDate: task.dueDate, kind: "Task", projectId: String(task.projectId) })), ...operations.filter((record) => ["procurement", "materials", "inspections"].includes(record.kind) && (record.data as { dueDate?: Date }).dueDate).map((record) => ({ title: record.title || record.kind, dueDate: (record.data as { dueDate: Date }).dueDate, kind: record.kind, projectId: String(record.projectId) }))].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 6);

    return ok({
      totalProjects: projects.length,
      activeProjects: projects.filter((p) => p.status === "Active" || p.status === "ACTIVE").length,
      completedProjects: projects.filter((p) => p.status === "Completed" || p.status === "COMPLETED").length,
      delayedProjects: projects.filter((p) => p.status === "Delayed" || p.status === "DELAYED").length,
      totalBudget,
      totalSpent,
      remainingBudget: totalBudget - totalSpent,
      projects: { total: projects.length, active: projects.filter((p) => p.status === "active").length, completed: projects.filter((p) => p.status === "completed").length, delayed: projects.filter((p) => p.healthStatus === "DELAYED").length, items: projects.slice(0, 8).map((p) => ({ id: String(p._id), name: p.name, projectCode: p.projectCode, client: p.client, location: p.location, manager: (p.projectManager as unknown as { fullName?: string } | null)?.fullName || "Unassigned", startDate: p.startDate, endDate: p.expectedEndDate, budget: Number(p.revisedBudget ?? p.totalBudget ?? 0), expenses: Number(p.amountSpent ?? 0), progress: Number(p.progressPercentage ?? 0), status: p.status, health: p.healthStatus })) },
      financial: { contractValue, budget: totalBudget, expenses: totalSpent, committedCost: projects.reduce((sum, p) => sum + Number(p.committedCost || 0), 0), remaining: totalBudget - totalSpent, budgetUsedPercentage: percentage(totalSpent, totalBudget) },
      tasks: { total: taskRows.length, completed: completedTasks, inProgress: taskRows.filter((task) => task.status === "IN_PROGRESS").length, overdue: overdueTasks, blocked: taskRows.filter((task) => task.status === "BLOCKED").length },
      operations: { materials: { total: materials.length, lowStock: materials.filter((item) => (item.data as { stockStatus?: string }).stockStatus === "LOW_STOCK").length, pendingDeliveries: materials.filter((item) => item.status === "PENDING").length }, procurement: { pendingRequests: procurement.filter((item) => item.status === "PENDING").length, approvedOrders: procurement.filter((item) => item.status === "APPROVED").length, pendingDeliveries: procurement.filter((item) => item.status === "DELIVERY_PENDING").length }, issues: { open: issues.filter((item) => ["OPEN", "IN_PROGRESS"].includes(item.status || "")).length, critical: issues.filter((item) => (item.data as { priority?: string }).priority === "CRITICAL").length } },
      deadlines,
      overallProgress: projects.length
        ? Math.round(
            projects.reduce((sum, p) => sum + (p.progressPercentage || 0), 0) / projects.length
          )
        : 0,
      pendingTasks,
      overdueTasks,
      recentActivities,
    });
  } catch (error) {
    return handleError(error);
  }
}
