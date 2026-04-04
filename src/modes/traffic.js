/**
 * Dijkstra's Algorithm — Traffic + Disaster Mode
 * Edges are treated as BIDIRECTIONAL by default (A→B also allows B→A).
 * Flooded / blocked nodes and edges are fully excluded before pathfinding.
 */
export function dijkstra(graph, startId, endId, blockedNodes = []) {
  const { nodes, edges } = graph;

  // Merge explicit blockedNodes arg with any node that has isBlocked: true
  const blockedSet = new Set([
    ...blockedNodes,
    ...nodes.filter((n) => n.isBlocked).map((n) => n.id),
  ]);

  // Can't route to/from a flooded node
  if (blockedSet.has(startId) || blockedSet.has(endId)) return [];

  // Build adjacency list — skip any blocked edge or edge touching a blocked node
  const adj = {};
  nodes.forEach((n) => { adj[n.id] = []; });

  edges.forEach((e) => {
    if (e.isBlocked) return;
    if (blockedSet.has(e.from) || blockedSet.has(e.to)) return;

    const w = e.weight ?? 1;

    // Always add both directions — roads in Bengaluru are effectively bidirectional
    // for pathfinding purposes even if the data only stores one direction
    adj[e.from]?.push({ to: e.to,   weight: w });
    adj[e.to]?.push({ to: e.from, weight: w });
  });

  // Initialise distances
  const dist = {};
  const prev = {};
  nodes.forEach((n) => {
    dist[n.id] = Infinity;
    prev[n.id] = null;
  });
  dist[startId] = 0;

  const visited = new Set();
  const unvisited = new Set(
    nodes.filter((n) => !blockedSet.has(n.id)).map((n) => n.id)
  );

  while (unvisited.size > 0) {
    // Pick unvisited node with smallest distance
    let curr = null;
    let minDist = Infinity;
    for (const id of unvisited) {
      if (dist[id] < minDist) {
        minDist = dist[id];
        curr = id;
      }
    }

    // All remaining nodes unreachable, or destination reached
    if (curr === null || curr === endId) break;

    unvisited.delete(curr);
    visited.add(curr);

    for (const { to, weight } of adj[curr] ?? []) {
      if (visited.has(to) || blockedSet.has(to)) continue;
      const candidate = dist[curr] + weight;
      if (candidate < dist[to]) {
        dist[to] = candidate;
        prev[to] = curr;
      }
    }
  }

  // No path found
  if (dist[endId] === Infinity) return [];

  // Reconstruct path
  const path = [];
  let cur = endId;
  while (cur !== null) {
    path.unshift(cur);
    cur = prev[cur];
  }

  return path[0] === startId ? path : [];
}