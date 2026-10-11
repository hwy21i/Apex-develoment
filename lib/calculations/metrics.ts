/**
 * Pure domain logic and calculations for Apex Construction ERP:
 * - Weighted WBS / Construction Phase Progress
 * - Planned S-Curve Schedule Tracking
 * - Budget Variance, Committed Costs & Change Orders
 * - Multi-factor Project Health Evaluation
 */

export interface ProjectMetricsResult {
  amountSpent: number;
  committedCost: number;
  revisedBudget: number;
  remainingBudget: number;
  progressPercentage: number;
  plannedProgressPercentage: number;
  forecastFinalCost: number;
  healthStatus: "ON_TRACK" | "AT_RISK" | "DELAYED" | "CRITICAL";
}

export function calculateWeightedProgress(
  phases: Array<{ plannedPercentage?: number; actualPercentage?: number }> = [],
  tasks: Array<{ progress?: number }> = [],
  fallbackProgress = 0
): number {
  const totalPhaseWeight = phases.reduce((sum, p) => sum + Number(p.plannedPercentage || 0), 0);

  if (phases.length > 0 && totalPhaseWeight > 0) {
    // Weighted by construction phases
    const weighted = phases.reduce(
      (sum, p) => sum + (Number(p.plannedPercentage || 0) * Number(p.actualPercentage || 0)) / 100,
      0
    );
    const result = weighted / (totalPhaseWeight / 100);
    return Math.min(100, Math.max(0, Math.round(result * 10) / 10));
  } else if (tasks.length > 0) {
    // Average of task progress
    const totalProgress = tasks.reduce((sum, t) => sum + Number(t.progress || 0), 0);
    const result = totalProgress / tasks.length;
    return Math.min(100, Math.max(0, Math.round(result * 10) / 10));
  }

  return Math.min(100, Math.max(0, Math.round(Number(fallbackProgress || 0) * 10) / 10));
}

export function calculatePlannedProgress(
  startDate: string | Date,
  expectedEndDate: string | Date,
  currentDate: string | Date = new Date()
): number {
  const start = new Date(startDate).getTime();
  const end = new Date(expectedEndDate).getTime();
  const now = new Date(currentDate).getTime();

  if (end <= start) return 0;
  if (now <= start) return 0;
  if (now >= end) return 100;

  const elapsed = now - start;
  const total = end - start;
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

export function calculateBudgetMetrics(
  originalBudget: number,
  amountSpent: number,
  committedCost: number,
  variationTotal: number
) {
  const orig = Math.max(0, Number(originalBudget || 0));
  const spent = Math.max(0, Number(amountSpent || 0));
  const committed = Math.max(0, Number(committedCost || 0));
  const variations = Number(variationTotal || 0);

  const revisedBudget = Math.max(0, orig + variations);
  const forecastFinalCost = spent + committed;
  const remainingBudget = Math.max(0, revisedBudget - forecastFinalCost);
  const budgetVariance = revisedBudget - forecastFinalCost;

  return {
    revisedBudget,
    amountSpent: spent,
    committedCost: committed,
    forecastFinalCost,
    remainingBudget,
    budgetVariance,
    isOverBudget: revisedBudget > 0 && forecastFinalCost > revisedBudget,
  };
}

export function evaluateProjectHealth(params: {
  criticalIssues: number;
  amountSpent: number;
  committedCost: number;
  revisedBudget: number;
  progressPercentage: number;
  plannedProgressPercentage: number;
  isOverdue: boolean;
}): "ON_TRACK" | "AT_RISK" | "DELAYED" | "CRITICAL" {
  const {
    criticalIssues,
    amountSpent,
    committedCost,
    revisedBudget,
    progressPercentage,
    plannedProgressPercentage,
    isOverdue,
  } = params;

  const totalCost = amountSpent + committedCost;
  const isBudgetExceeded = revisedBudget > 0 && totalCost > revisedBudget;
  const isNearBudgetLimit = revisedBudget > 0 && totalCost / revisedBudget > 0.92;
  const isSignificantlyBehindSchedule = plannedProgressPercentage - progressPercentage > 15;

  if (criticalIssues > 0 || isBudgetExceeded) {
    return "CRITICAL";
  }
  if (isOverdue) {
    return "DELAYED";
  }
  if (isNearBudgetLimit || isSignificantlyBehindSchedule) {
    return "AT_RISK";
  }
  return "ON_TRACK";
}

