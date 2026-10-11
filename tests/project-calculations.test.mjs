import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateWeightedProgress,
  calculatePlannedProgress,
  calculateBudgetMetrics,
  evaluateProjectHealth,
} from "../lib/calculations/metrics.ts";

test("Construction Progress - Weighted Phases Calculation", () => {
  // Scenario: 3 phases with planned weights: Substructure (30%), Superstructure (50%), Finishing (20%)
  const phases = [
    { plannedPercentage: 30, actualPercentage: 100 }, // completed: 30% contribution
    { plannedPercentage: 50, actualPercentage: 50 },  // half done: 25% contribution
    { plannedPercentage: 20, actualPercentage: 0 },   // not started: 0% contribution
  ];

  const progress = calculateWeightedProgress(phases, []);
  // Total = 30 + 25 + 0 = 55%
  assert.equal(progress, 55);
});

test("Construction Progress - Unweighted/Task Average Fallback", () => {
  // Scenario: No phases defined, 4 tasks with varying progress
  const tasks = [
    { progress: 100 },
    { progress: 50 },
    { progress: 25 },
    { progress: 25 },
  ];

  const progress = calculateWeightedProgress([], tasks);
  // Average = (100 + 50 + 25 + 25) / 4 = 50%
  assert.equal(progress, 50);
});

test("Construction Progress - Fallback when neither phases nor tasks exist", () => {
  const progress = calculateWeightedProgress([], [], 35.5);
  assert.equal(progress, 35.5);
});

test("Budget Metrics - Variations and Committed POs", () => {
  const originalBudget = 10_000_000;
  const approvedVariations = 1_500_000; // Change order increase
  const amountSpent = 4_000_000;
  const committedCost = 2_000_000; // Issued POs

  const metrics = calculateBudgetMetrics(
    originalBudget,
    amountSpent,
    committedCost,
    approvedVariations
  );

  assert.equal(metrics.revisedBudget, 11_500_000);
  assert.equal(metrics.forecastFinalCost, 6_000_000);
  assert.equal(metrics.remainingBudget, 5_500_000);
  assert.equal(metrics.budgetVariance, 5_500_000);
  assert.equal(metrics.isOverBudget, false);
});

test("Budget Metrics - Over Budget Detection", () => {
  const originalBudget = 5_000_000;
  const approvedVariations = 0;
  const amountSpent = 4_500_000;
  const committedCost = 1_000_000; // Total 5.5M vs 5.0M budget

  const metrics = calculateBudgetMetrics(
    originalBudget,
    amountSpent,
    committedCost,
    approvedVariations
  );

  assert.equal(metrics.forecastFinalCost, 5_500_000);
  assert.equal(metrics.remainingBudget, 0); // Math.max(0, -500k)
  assert.equal(metrics.budgetVariance, -500_000);
  assert.equal(metrics.isOverBudget, true);
});

test("Planned Progress - S-Curve Linear Timeline Estimation", () => {
  const start = new Date("2026-01-01T00:00:00Z");
  const end = new Date("2026-01-31T00:00:00Z");
  const mid = new Date("2026-01-16T00:00:00Z"); // half way

  const plannedMid = calculatePlannedProgress(start, end, mid);
  assert.ok(plannedMid >= 48 && plannedMid <= 52, `Midpoint progress should be ~50%, got ${plannedMid}`);

  const plannedBefore = calculatePlannedProgress(start, end, new Date("2025-12-01T00:00:00Z"));
  assert.equal(plannedBefore, 0);

  const plannedAfter = calculatePlannedProgress(start, end, new Date("2026-02-15T00:00:00Z"));
  assert.equal(plannedAfter, 100);
});

test("Project Health Evaluation - Status Flags", () => {
  // CRITICAL if critical issues exist
  const critical = evaluateProjectHealth({
    criticalIssues: 2,
    amountSpent: 1000,
    committedCost: 500,
    revisedBudget: 10000,
    progressPercentage: 50,
    plannedProgressPercentage: 50,
    isOverdue: false,
  });
  assert.equal(critical, "CRITICAL");

  // CRITICAL if budget exceeded
  const overBudget = evaluateProjectHealth({
    criticalIssues: 0,
    amountSpent: 8000,
    committedCost: 3000, // Total 11000 > 10000
    revisedBudget: 10000,
    progressPercentage: 50,
    plannedProgressPercentage: 50,
    isOverdue: false,
  });
  assert.equal(overBudget, "CRITICAL");

  // DELAYED if overdue
  const delayed = evaluateProjectHealth({
    criticalIssues: 0,
    amountSpent: 2000,
    committedCost: 1000,
    revisedBudget: 10000,
    progressPercentage: 80,
    plannedProgressPercentage: 100,
    isOverdue: true,
  });
  assert.equal(delayed, "DELAYED");

  // AT_RISK if schedule gap > 15%
  const atRiskSchedule = evaluateProjectHealth({
    criticalIssues: 0,
    amountSpent: 2000,
    committedCost: 1000,
    revisedBudget: 10000,
    progressPercentage: 40,
    plannedProgressPercentage: 65, // Gap of 25%
    isOverdue: false,
  });
  assert.equal(atRiskSchedule, "AT_RISK");

  // ON_TRACK when everything within tolerance
  const onTrack = evaluateProjectHealth({
    criticalIssues: 0,
    amountSpent: 2000,
    committedCost: 1000,
    revisedBudget: 10000,
    progressPercentage: 50,
    plannedProgressPercentage: 52,
    isOverdue: false,
  });
  assert.equal(onTrack, "ON_TRACK");
});
