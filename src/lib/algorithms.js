/**
 * UrbanTwins — Graph Algorithms
 * Pure vanilla JS implementations, no dependencies.
 * All functions are pure: they do not mutate the graph.
 */

// ─── Dijkstra's Shortest Path (Traffic + Disaster) ────────────────────────────

/**
 * Returns the shortest path from `source` to `target` on the adjacency list.
 *
 * @param {Record<string, {to:string, weight:number, edgeId:string}[]>} adj
 * @param {string} source
 * @param {string} target
 * @returns {{ path: string[], edgeIds: string[], distance: number } | null}
 */
export function dijkstra(adj, source, target) {
  const dist   = {};
  const prev   = {};
  const prevEdge = {};
  const visited = new Set();

  // Simple array-based min-priority queue (good enough for N≤200)
  const pq = []; // [{node, dist}]
  const pqPush = (node, d) => {
    pq.push({ node, dist: d });
    pq.sort((a, b) => a.dist - b.dist);
  };
  const pqPop = () => pq.shift();

  for (const node of Object.keys(adj)) {
    dist[node] = Infinity;
  }
  dist[source] = 0;
  pqPush(source, 0);

  while (pq.length > 0) {
    const { node: u } = pqPop();
    if (visited.has(u)) continue;
    visited.add(u);

    if (u === target) break;

    for (const { to: v, weight: w, edgeId } of adj[u] ?? []) {
      if (visited.has(v)) continue;
      const alt = dist[u] + w;
      if (alt < dist[v]) {
        dist[v]    = alt;
        prev[v]    = u;
        prevEdge[v] = edgeId;
        pqPush(v, alt);
      }
    }
  }

  if (dist[target] === Infinity) return null; // no path

  // Reconstruct path
  const path = [];
  const edgeIds = [];
  let cur = target;
  while (cur !== undefined) {
    path.unshift(cur);
    if (prevEdge[cur]) edgeIds.unshift(prevEdge[cur]);
    cur = prev[cur];
  }

  return { path, edgeIds, distance: dist[target] };
}

// ─── Prim's Minimum Spanning Tree (Water) ────────────────────────────────────

/**
 * Returns the MST as a list of edge IDs.
 * The adjacency list must be undirected (each edge appears in both directions).
 *
 * @param {Record<string, {to:string, weight:number, edgeId:string}[]>} adj
 * @param {string} start - starting node
 * @returns {{ edgeIds: string[], totalWeight: number }}
 */
export function primMST(adj, start) {
  const inMST    = new Set([start]);
  const edgeIds  = [];
  let totalWeight = 0;

  // Candidate edges: all edges from nodes in MST to nodes outside
  const getCandidates = () => {
    const candidates = [];
    for (const u of inMST) {
      for (const { to: v, weight: w, edgeId } of adj[u] ?? []) {
        if (!inMST.has(v)) candidates.push({ from: u, to: v, weight: w, edgeId });
      }
    }
    return candidates;
  };

  while (inMST.size < Object.keys(adj).length) {
    const candidates = getCandidates();
    if (candidates.length === 0) break; // disconnected graph

    // Pick minimum weight edge
    candidates.sort((a, b) => a.weight - b.weight);
    const { to, weight, edgeId } = candidates[0];

    inMST.add(to);
    edgeIds.push(edgeId);
    totalWeight += weight;
  }

  return { edgeIds, totalWeight };
}

// ─── Ford-Fulkerson Max Flow (Energy) ────────────────────────────────────────

/**
 * Computes max flow from `source` to `sink`.
 * Uses BFS (Edmonds-Karp) for augmenting paths.
 *
 * @param {string[]} nodeIds
 * @param {{from:string, to:string, capacity:number}[]} edges
 * @param {string} source
 * @param {string} sink
 * @returns {{ maxFlow: number, saturatedEdgeIds: string[] }}
 */
export function maxFlowEdmondsKarp(nodeIds, edges, source, sink) {
  // Build capacity map
  const cap  = {}; // cap[u][v] = remaining capacity
  const edgeKey = (u, v) => `${u}→${v}`;
  const edgeIdMap = {}; // edgeKey → original edge id

  for (const { from: u, to: v, capacity, id } of edges) {
    cap[edgeKey(u, v)] = (cap[edgeKey(u, v)] ?? 0) + capacity;
    cap[edgeKey(v, u)] = cap[edgeKey(v, u)] ?? 0; // reverse edge
    if (id) edgeIdMap[edgeKey(u, v)] = id;
  }

  // Collect all unique directed pairs for BFS
  const adjacents = {};
  for (const { from: u, to: v } of edges) {
    (adjacents[u] = adjacents[u] ?? new Set()).add(v);
    (adjacents[v] = adjacents[v] ?? new Set()).add(u); // reverse
  }

  let maxFlow = 0;

  // BFS to find augmenting path
  const bfs = () => {
    const visited = new Set([source]);
    const parent  = { [source]: null };
    const queue   = [source];

    while (queue.length > 0) {
      const u = queue.shift();
      for (const v of (adjacents[u] ?? [])) {
        if (!visited.has(v) && (cap[edgeKey(u, v)] ?? 0) > 0) {
          visited.add(v);
          parent[v] = u;
          if (v === sink) return parent;
          queue.push(v);
        }
      }
    }
    return null; // no augmenting path
  };

  let parent;
  while ((parent = bfs())) {
    // Find min residual capacity along the path
    let pathFlow = Infinity;
    for (let v = sink; parent[v] !== null; v = parent[v]) {
      const u = parent[v];
      pathFlow = Math.min(pathFlow, cap[edgeKey(u, v)]);
    }

    // Update capacities
    for (let v = sink; parent[v] !== null; v = parent[v]) {
      const u = parent[v];
      cap[edgeKey(u, v)] -= pathFlow;
      cap[edgeKey(v, u)] = (cap[edgeKey(v, u)] ?? 0) + pathFlow;
    }

    maxFlow += pathFlow;
  }

  // Find saturated edges (remaining capacity = 0)
  const saturatedEdgeIds = edges
    .filter(e => (cap[edgeKey(e.from, e.to)] ?? 0) === 0)
    .map(e => e.id)
    .filter(Boolean);

  return { maxFlow, saturatedEdgeIds };
}