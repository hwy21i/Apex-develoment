/**
 * Graph dependency algorithms for Construction Task scheduling,
 * Work Breakdown Structure (WBS), and CPM (Critical Path Method).
 */

export function detectCycleInDependencies(
  targetId: string,
  newDependencies: string[],
  lookupDependencies: (id: string) => string[] | undefined
): boolean {
  const visited = new Set<string>();
  const queue = [...newDependencies];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === targetId) return true;
    if (visited.has(current)) continue;
    visited.add(current);

    const deps = lookupDependencies(current);
    if (Array.isArray(deps)) {
      for (const d of deps) {
        if (d === targetId) return true;
        if (!visited.has(d)) {
          queue.push(d);
        }
      }
    }
  }
  return false;
}

export function validateDependencyGraph(tasks: Array<{ id: string; dependencies?: string[] }>): {
  isValidDAG: boolean;
  cycleNodeId?: string;
  topologicalOrder?: string[];
} {
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const task of tasks) {
    inDegree.set(task.id, 0);
    adjacency.set(task.id, []);
  }

  for (const task of tasks) {
    const deps = task.dependencies || [];
    for (const dep of deps) {
      if (adjacency.has(dep)) {
        adjacency.get(dep)!.push(task.id);
        inDegree.set(task.id, (inDegree.get(task.id) || 0) + 1);
      }
    }
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) queue.push(id);
  }

  const topologicalOrder: string[] = [];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    topologicalOrder.push(curr);

    const neighbors = adjacency.get(curr) || [];
    for (const next of neighbors) {
      const newDeg = (inDegree.get(next) || 0) - 1;
      inDegree.set(next, newDeg);
      if (newDeg === 0) {
        queue.push(next);
      }
    }
  }

  if (topologicalOrder.length === tasks.length) {
    return { isValidDAG: true, topologicalOrder };
  }

  // Find node with inDegree > 0 that is part of a cycle
  for (const [id, deg] of inDegree.entries()) {
    if (deg > 0) {
      return { isValidDAG: false, cycleNodeId: id };
    }
  }

  return { isValidDAG: false };
}

