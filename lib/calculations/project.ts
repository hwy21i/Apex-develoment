import { ProjectPhase } from "@/models/ProjectPhase";
import { Operational } from "@/models/Operational";
import { Project } from "@/models/Project";
import { Expense } from "@/models/Expense";
import { PurchaseOrder } from "@/models/PurchaseOrder";
import { ChangeOrder } from "@/models/ChangeOrder";
import { Task } from "@/models/Task";
import {
  calculateWeightedProgress,
  calculatePlannedProgress,
  calculateBudgetMetrics,
  evaluateProjectHealth,
  ProjectMetricsResult,
} from "./metrics";

export {
  calculateWeightedProgress,
  calculatePlannedProgress,
  calculateBudgetMetrics,
  evaluateProjectHealth,
};
export type { ProjectMetricsResult };

export async function refreshProjectMetrics(projectId: string) {
  const [
    project,
    phases,
    tasks,
    dedicatedExpenses,
    operationalExpenses,
    committedPOs,
    approvedChangeOrders,
    criticalIssues,
  ] = await Promise.all([
    Project.findById(projectId),
    ProjectPhase.find({ projectId }).lean(),
    Task.find({ projectId }).lean(),
    Expense.find({ projectId, status: { $in: ["APPROVED", "PAID"] } }).lean(),
    Operational.find({ projectId, kind: "expenses", status: "APPROVED" }).lean(),
    PurchaseOrder.find({ projectId, status: { $in: ["ISSUED", "PARTIALLY_DELIVERED"] } }).lean(),
    ChangeOrder.find({ projectId, status: "APPROVED" }).lean(),
    Operational.countDocuments({
      projectId,
      kind: "issues",
      status: { $in: ["OPEN", "INVESTIGATING"] },
      "data.priority": "CRITICAL",
    }),
  ]);

  if (!project) return null;

  // 1. Calculate Actual Expenditure (avoiding double-counting)
  const dedicatedSpent = dedicatedExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const operationalSpent = operationalExpenses.reduce(
    (sum, e) => sum + Number((e.data as { amount?: number })?.amount || 0),
    0
  );
  // Use dedicated if populated, otherwise fallback to operational
  const amountSpent = dedicatedSpent > 0 ? dedicatedSpent : operationalSpent;

  // 2. Committed Costs from Issued Purchase Orders
  const committedCost = committedPOs.reduce((sum, po) => sum + Number(po.totalAmount || 0), 0);

  // 3. Approved Variations & Revised Budget
  const variationTotal = approvedChangeOrders.reduce((sum, co) => sum + Number(co.costImpact || 0), 0);
  const budgetMetrics = calculateBudgetMetrics(
    project.totalBudget,
    amountSpent,
    committedCost,
    variationTotal
  );

  // 4. Progress Calculations: Weighted Phases OR Task Effort Weights
  const progressPercentage = calculateWeightedProgress(
    phases,
    tasks,
    project.progressPercentage
  );

  // 5. Planned Progress Timeline Estimation
  const now = new Date();
  const plannedProgressPercentage = calculatePlannedProgress(
    project.startDate,
    project.expectedEndDate,
    now
  );

  // 6. Project Health Evaluation
  const end = new Date(project.expectedEndDate);
  const isOverdue = now > end && progressPercentage < 100;
  const healthStatus = evaluateProjectHealth({
    criticalIssues,
    amountSpent,
    committedCost,
    revisedBudget: budgetMetrics.revisedBudget,
    progressPercentage,
    plannedProgressPercentage,
    isOverdue,
  });

  Object.assign(project, {
    amountSpent: budgetMetrics.amountSpent,
    committedCost: budgetMetrics.committedCost,
    revisedBudget: budgetMetrics.revisedBudget,
    remainingBudget: budgetMetrics.remainingBudget,
    progressPercentage,
    healthStatus,
  });

  await project.save();
  return project;
}
