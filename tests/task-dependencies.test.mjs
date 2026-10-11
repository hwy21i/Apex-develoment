import test from "node:test";
import assert from "node:assert/strict";
import {
  detectCycleInDependencies,
  validateDependencyGraph,
} from "../lib/calculations/dependencies.ts";

test("Task Dependencies - Cycle Detection (A -> B -> A)", () => {
  // Existing tasks:
  // Task B depends on Task A
  const dependencyMap = {
    taskB: ["taskA"],
  };

  // Now user attempts to make Task A depend on Task B:
  const hasCycle = detectCycleInDependencies("taskA", ["taskB"], (id) => dependencyMap[id]);
  assert.equal(hasCycle, true, "Should detect circular dependency A -> B -> A");
});

test("Task Dependencies - Multi-node Cycle Detection (A -> B -> C -> A)", () => {
  const dependencyMap = {
    taskB: ["taskA"],
    taskC: ["taskB"],
  };

  // User attempts to make Task A depend on Task C:
  const hasCycle = detectCycleInDependencies("taskA", ["taskC"], (id) => dependencyMap[id]);
  assert.equal(hasCycle, true, "Should detect transitive circular dependency A -> B -> C -> A");
});

test("Task Dependencies - Self-referencing Loop (A -> A)", () => {
  const hasCycle = detectCycleInDependencies("taskA", ["taskA"], () => []);
  assert.equal(hasCycle, true, "Should detect immediate self dependency loop");
});

test("Task Dependencies - Valid DAG without cycles", () => {
  // Linear construction flow:
  // Excavation (1) -> Foundation (2) -> Framing (3) -> Roofing (4)
  const dependencyMap = {
    task1: [],
    task2: ["task1"],
    task3: ["task2"],
  };

  // Adding task4 depending on task3 is valid
  const hasCycle = detectCycleInDependencies("task4", ["task3"], (id) => dependencyMap[id]);
  assert.equal(hasCycle, false, "Should allow valid DAG dependency");
});

test("Task Graph - Topological Order Validation", () => {
  const tasks = [
    { id: "excavation", dependencies: [] },
    { id: "foundation", dependencies: ["excavation"] },
    { id: "framing", dependencies: ["foundation"] },
    { id: "plumbing", dependencies: ["framing"] },
    { id: "electrical", dependencies: ["framing"] },
    { id: "drywall", dependencies: ["plumbing", "electrical"] },
  ];

  const result = validateDependencyGraph(tasks);
  assert.equal(result.isValidDAG, true);
  assert.equal(result.topologicalOrder?.length, 6);

  // Excavation must come before foundation
  const order = result.topologicalOrder || [];
  assert.ok(order.indexOf("excavation") < order.indexOf("foundation"));
  assert.ok(order.indexOf("foundation") < order.indexOf("framing"));
  assert.ok(order.indexOf("framing") < order.indexOf("plumbing"));
  assert.ok(order.indexOf("drywall") > order.indexOf("plumbing"));
  assert.ok(order.indexOf("drywall") > order.indexOf("electrical"));
});

test("Task Graph - Invalid Cycle Node Identification", () => {
  const cyclicTasks = [
    { id: "taskA", dependencies: ["taskC"] },
    { id: "taskB", dependencies: ["taskA"] },
    { id: "taskC", dependencies: ["taskB"] },
  ];

  const result = validateDependencyGraph(cyclicTasks);
  assert.equal(result.isValidDAG, false);
  assert.ok(result.cycleNodeId !== undefined);
});

