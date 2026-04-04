/**
 * Dijkstra's Algorithm — Traffic + Disaster Mode
 *
 * Flood rules:
 *  - Flooded nodes/edges are removed from the graph
 *  - A flooded node CAN be the source (evacuating from disaster zone)
 *  - A flooded node CANNOT be the destination
 *  - Traversal never passes through other flooded nodes
 *
 * @param {Object}   cityGraph         - { nodes, edges }
 * @param {string}   startId           - Starting node ID (may be flooded)
 * @param {string}   endId             - Destination node ID (must NOT be flooded)
 * @param {string[]} [blockedNodes=[]] - Extra node IDs to treat as blocked
 * @returns {string[]} Ordered node ID array, or [] if no path found
 */
export function dijkstra(cityGraph, startId, endId, blockedNodes = []) {
  const { nodes, edges } = cityGraph;

  // ── 1. Build blocked set (arg list + isBlocked flags) ────────────────────
  const blockedSet = new Set([
    ...blockedNodes,
    ...nodes.filter((n) => n.isBlocked).map((n) => n.id),
  ]);

  // ── 2. Destination must never be a flooded node ───────────────────────────
  if (blockedSet.has(endId)) return [];

  // ── 3. Build adjacency list ───────────────────────────────────────────────
  //    - Skip blocked edges entirely
  //    - Skip edges whose destination is a blocked node (can't enter)
  //    - If the SOURCE of an edge is the start node and start is flooded,
  //      still allow it — the evacuee is leaving, not staying
  const adj = {};
  nodes.forEach((n) => { adj[n.id] = []; });

  edges.forEach((e) => {
    // Always skip blocked edges
    if (e.isBlocked) return;

    // Never enter a blocked node
    if (blockedSet.has(e.to))   return;
    if (blockedSet.has(e.from)) return;

    const w = e.weight ?? 1;

    // Bidirectional — add both directions
    adj[e.from]?.push({ to: e.to,   weight: w });
    adj[e.to]?.push(  { to: e.from, weight: w });
  });

  // ── Special case: start is flooded ───────────────────────────────────────
  //    Re-scan edges originating from start and add them manually,
  //    since the loop above skipped them (blockedSet.has(e.from)).
  if (blockedSet.has(startId)) {
    edges.forEach((e) => {
      if (e.isBlocked) return;
      if (blockedSet.has(e.to)) return; // still can't enter a blocked node

      const w = e.weight ?? 1;

      // Edge directly from flooded start → unblocked neighbour
      if (e.from === startId) {
        adj[startId]?.push({ to: e.to,   weight: w });
        // Also allow reverse direction back to start for symmetry,
        // but traversal won't revisit start once we leave it
        adj[e.to]?.push(   { to: startId, weight: w });
      }

      // Edge that ends at start (bidirectional road leading out)
      if (e.to === startId) {
        adj[startId]?.push({ to: e.from, weight: w });
        adj[e.from]?.push( { to: startId, weight: w });
      }
    });
  }

  // ── 4. Initialise distances ───────────────────────────────────────────────
  const dist = {};
  const prev = {};
  nodes.forEach((n) => { dist[n.id] = Infinity; prev[n.id] = null; });
  dist[startId] = 0;

  const visited   = new Set();

  // Unvisited pool — exclude blocked nodes EXCEPT the start
  const unvisited = new Set(
    nodes
      .filter((n) => !blockedSet.has(n.id) || n.id === startId)
      .map((n) => n.id)
  );

  // ── 5. Main Dijkstra loop ─────────────────────────────────────────────────
  while (unvisited.size > 0) {
    // Pick unvisited node with smallest tentative distance
    let curr    = null;
    let minDist = Infinity;
    for (const id of unvisited) {
      if (dist[id] < minDist) { minDist = dist[id]; curr = id; }
    }

    // All remaining nodes are unreachable, or we've arrived
    if (curr === null || curr === endId) break;

    unvisited.delete(curr);
    visited.add(curr);

    for (const { to, weight } of (adj[curr] ?? [])) {
      // Never traverse into a blocked node (start is the only allowed exception)
      if (visited.has(to)) continue;
      if (blockedSet.has(to) && to !== startId) continue;

      const candidate = dist[curr] + weight;
      if (candidate < dist[to]) {
        dist[to] = candidate;
        prev[to] = curr;
      }
    }
  }

  // ── 6. No path ────────────────────────────────────────────────────────────
  if (dist[endId] === Infinity) return [];

  // ── 7. Reconstruct path ───────────────────────────────────────────────────
  const path = [];
  let cur = endId;
  while (cur !== null) { path.unshift(cur); cur = prev[cur]; }

  return path[0] === startId ? path : [];
}

/**
 * Mutates the graph in-place to simulate a flood/disaster event.
 *
 * @param {Object}   cityGraph       - { nodes, edges }
 * @param {string[]} floodedNodeIds  - Node IDs to block
 * @param {Object[]} floodedEdges    - Edges to block: [{ from, to }, ...]
 */
export function triggerFlood(cityGraph, floodedNodeIds = [], floodedEdges = []) {
  floodedNodeIds.forEach((id) => {
    const node = cityGraph.nodes.find((n) => n.id === id);
    if (node) node.isBlocked = true;
  });

  floodedEdges.forEach(({ from, to }) => {
    const edge = cityGraph.edges.find((e) => e.from === from && e.to === to);
    if (edge) edge.isBlocked = true;
  });
}