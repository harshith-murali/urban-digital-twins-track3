// modes/traffic.js

function getTrafficMultiplier(color) {
  if (color === "red") return 5;
  if (color === "yellow") return 3;
  return 1;
}

export function dijkstra(cityGraph, startId, endId, blockedNodes = []) {
  const { nodes, edges } = cityGraph;

  const blockedSet = new Set(blockedNodes);

  const nodeIndex = {};
  nodes.forEach((node, i) => {
    nodeIndex[node.id] = i;
  });

  const n = nodes.length;

  const graph = Array.from({ length: n }, () => []);

  edges.forEach((edge) => {
    const u = nodeIndex[edge.from];
    const v = nodeIndex[edge.to];

    if (u === undefined || v === undefined) return;
    if (blockedSet.has(edge.from) || blockedSet.has(edge.to)) return;
    if (edge.isBlocked) return;

    const baseDistance = edge.weight ?? 1;
    const congestion = edge.congestion || "green";

    const multiplier = getTrafficMultiplier(congestion);
    const cost = baseDistance * multiplier;

    graph[u].push({ to: v, weight: cost });
    graph[v].push({ to: u, weight: cost });
  });

  const dist = new Array(n).fill(Infinity);
  const parent = new Array(n).fill(-1);
  const visited = new Array(n).fill(false);

  const start = nodeIndex[startId];
  const end = nodeIndex[endId];

  if (start === undefined || end === undefined) return [];

  dist[start] = 0;

  for (let i = 0; i < n; i++) {
    let u = -1;

    for (let j = 0; j < n; j++) {
      if (!visited[j] && (u === -1 || dist[j] < dist[u])) {
        u = j;
      }
    }

    if (u === -1 || dist[u] === Infinity) break;

    visited[u] = true;

    for (const neighbor of graph[u]) {
      const v = neighbor.to;
      const alt = dist[u] + neighbor.weight;

      if (alt < dist[v]) {
        dist[v] = alt;
        parent[v] = u;
      }
    }
  }

  const path = [];
  let curr = end;

  while (curr !== -1) {
    path.push(nodes[curr].id);
    curr = parent[curr];
  }

  path.reverse();

  if (path.length === 0 || path[0] !== startId) return [];

  return path;
}
