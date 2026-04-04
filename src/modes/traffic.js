export function dijkstra(graph, startId, endId, blockedNodes = []) {
  const { nodes, edges } = graph
  const dist = {}, prev = {}
  nodes.forEach(n => { dist[n.id] = Infinity; prev[n.id] = null })
  dist[startId] = 0
  const visited = new Set()

  while (true) {
    const curr = nodes
      .filter(n => !visited.has(n.id) && !blockedNodes.includes(n.id))
      .reduce((min, n) => dist[n.id] < dist[min.id] ? n : min, nodes[0])

    if (!curr || dist[curr.id] === Infinity || curr.id === endId) break
    visited.add(curr.id)

    edges
      .filter(e => e.from === curr.id && !e.isBlocked)
      .forEach(e => {
        const d = dist[curr.id] + e.weight
        if (d < dist[e.to]) { dist[e.to] = d; prev[e.to] = curr.id }
      })
  }

  const path = []
  let cur = endId
  while (cur) { path.unshift(cur); cur = prev[cur] }
  return path[0] === startId ? path : []
}