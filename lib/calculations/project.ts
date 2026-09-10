import { ProjectPhase } from "@/models/ProjectPhase";
import { Operational } from "@/models/Operational";
import { Project } from "@/models/Project";

export async function refreshProjectMetrics(projectId: string) {
  const [project, phases, expenses, criticalIssues] = await Promise.all([Project.findById(projectId), ProjectPhase.find({ projectId }), Operational.find({ projectId, kind: "expenses", status: "APPROVED" }), Operational.countDocuments({ projectId, kind: "issues", status: { $in: ["OPEN", "INVESTIGATING"] }, "data.priority": "CRITICAL" })]);
  if (!project) return null;
  const amountSpent = expenses.reduce((sum, expense) => sum + Number((expense.data as { amount?: number }).amount ?? 0), 0);
  const totalWeight = phases.reduce((sum, phase) => sum + phase.plannedPercentage, 0);
  const progressPercentage = totalWeight ? phases.reduce((sum, phase) => sum + (phase.plannedPercentage * phase.actualPercentage) / 100, 0) : 0;
  const budget = project.revisedBudget ?? project.totalBudget;
  const late = project.expectedEndDate < new Date() && progressPercentage < 100;
  const healthStatus = criticalIssues > 0 || (budget > 0 && amountSpent > budget) ? "CRITICAL" : late ? "DELAYED" : criticalIssues > 0 || (budget > 0 && amountSpent / budget > 0.9) ? "AT_RISK" : "ON_TRACK";
  Object.assign(project, { amountSpent, remainingBudget: budget - amountSpent, progressPercentage: Math.round(progressPercentage * 100) / 100, healthStatus });
  await project.save();
  return project;
}
