// ─────────────────────────────────────────────────────────────────────────────
// Priority Queue (min-heap via sorted array)
// ─────────────────────────────────────────────────────────────────────────────
class PriorityQueue {
  constructor() { this.values = []; }
  enqueue(item, priority) {
    this.values.push({ item, priority });
    this.values.sort((a, b) => a.priority - b.priority);
  }
  dequeue() { return this.values.shift(); }
  isEmpty() { return this.values.length === 0; }
}

// ─────────────────────────────────────────────────────────────────────────────
// Types (JSDoc for editor hints)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @typedef {Object} Edge
 * @property {string} from
 * @property {string} to
 * @property {number} cost          - laying cost (arbitrary units)
 * @property {number} pressureLoss  - pressure drop across this pipe (bar)
 * @property {number} capacity      - max flow (L/s)
 * @property {boolean} [broken]     - true if this pipe has failed
 */

/**
 * @typedef {Object} MSTResult
 * @property {Edge[]}  mstEdges         - edges chosen for the MST
 * @property {number}  totalCost        - sum of edge costs
 * @property {number}  totalPressureLoss
 * @property {Object}  nodePressure     - { nodeId: pressure } after propagation
 * @property {string}  status           - "ok" | "degraded" | "failed"
 * @property {string[]} warnings        - human-readable issues
 * @property {Object}  mapData          - ready-to-render edge + node arrays
 */

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const SOURCE_NODE      = "TP";   // treatment plant — source of pressure
const SOURCE_PRESSURE  = 4.0;    // bar at source
const MIN_PRESSURE     = 1.5;    // bar — below this a zone is "critical"
const WARNING_PRESSURE = 2.5;    // bar — below this a zone is "degraded"

// ─────────────────────────────────────────────────────────────────────────────
// 1. Build adjacency list from an edge array (bidirectional)
// ─────────────────────────────────────────────────────────────────────────────
export function buildAdjacency(edges) {
  const adj = {};
  for (const e of edges) {
    if (!adj[e.from]) adj[e.from] = [];
    if (!adj[e.to])   adj[e.to]   = [];
    if (!e.broken) {
      adj[e.from].push({ to: e.to,   cost: e.cost, pressureLoss: e.pressureLoss, capacity: e.capacity });
      adj[e.to].push(  { to: e.from, cost: e.cost, pressureLoss: e.pressureLoss, capacity: e.capacity });
    }
  }
  return adj;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Propagate pressure from source through MST edges (BFS)
// ─────────────────────────────────────────────────────────────────────────────
function propagatePressure(mstEdges, nodes) {
  const pressure = {};
  nodes.forEach((n) => { pressure[n.id] = null; });
  pressure[SOURCE_NODE] = SOURCE_PRESSURE;

  // Build adjacency from MST edges only
  const adj = {};
  for (const e of mstEdges) {
    if (!adj[e.from]) adj[e.from] = [];
    if (!adj[e.to])   adj[e.to]   = [];
    adj[e.from].push({ to: e.to,   loss: e.pressureLoss });
    adj[e.to].push(  { to: e.from, loss: e.pressureLoss });
  }

  // BFS from source
  const queue = [SOURCE_NODE];
  const visited = new Set([SOURCE_NODE]);
  while (queue.length) {
    const cur = queue.shift();
    for (const { to, loss } of (adj[cur] || [])) {
      if (!visited.has(to)) {
        visited.add(to);
        pressure[to] = Math.max(0, (pressure[cur] ?? 0) - loss);
        queue.push(to);
      }
    }
  }
  return pressure;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Prim's MST with pressure-weighted cost  (k controls pressure importance)
// ─────────────────────────────────────────────────────────────────────────────
function primMST(adj, nodes, brokenEdgeIds = new Set(), k = 1.5) {
  const nodeIds  = nodes.map((n) => n.id);
  const visited  = new Set();
  const mstEdges = [];
  let   totalCost = 0;
  let   totalPressureLoss = 0;

  const pq = new PriorityQueue();
  pq.enqueue({ id: SOURCE_NODE, from: null, edgeData: null }, 0);

  while (!pq.isEmpty()) {
    const { item } = pq.dequeue();
    const { id: cur, from, edgeData } = item;

    if (visited.has(cur)) continue;
    visited.add(cur);

    if (from !== null && edgeData) {
      mstEdges.push({ from, to: cur, ...edgeData });
      totalCost         += edgeData.cost;
      totalPressureLoss += edgeData.pressureLoss;
    }

    for (const neighbor of (adj[cur] || [])) {
      if (!visited.has(neighbor.to)) {
        const effectiveWeight = neighbor.cost + k * neighbor.pressureLoss;
        pq.enqueue(
          { id: neighbor.to, from: cur, edgeData: neighbor },
          effectiveWeight
        );
      }
    }
  }

  // Detect unreachable nodes
  const unreached = nodeIds.filter((id) => !visited.has(id));

  return { mstEdges, totalCost, totalPressureLoss, unreached };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Format output for map rendering
// ─────────────────────────────────────────────────────────────────────────────
function buildMapData(nodes, mstEdges, nodePressure, brokenEdges, rerouteEdges) {
  const brokenSet  = new Set(brokenEdges.map((e) => `${e.from}-${e.to}`));
  const rerouteSet = new Set(rerouteEdges.map((e) => `${e.from}-${e.to}`));

  const mapEdges = [
    // Original MST edges
    ...mstEdges.map((e) => {
      const key = `${e.from}-${e.to}`;
      const keyRev = `${e.to}-${e.from}`;
      const isBroken  = brokenSet.has(key)  || brokenSet.has(keyRev);
      const isReroute = rerouteSet.has(key) || rerouteSet.has(keyRev);
      return {
        from: e.from, to: e.to,
        cost: e.cost, pressureLoss: e.pressureLoss,
        type: isBroken ? "broken" : isReroute ? "reroute" : "active",
        // Map visual hints
        stroke:      isBroken ? "#E24B4A" : isReroute ? "#EF9F27" : "#85B7EB",
        strokeWidth: isBroken ? 1 : isReroute ? 2.5 : 2,
        dashArray:   isBroken ? "5,4" : isReroute ? "7,3" : null,
        opacity:     isBroken ? 0.35 : 1,
      };
    }),
    // New reroute edges not already in MST
    ...rerouteEdges
      .filter((e) => {
        const inMST = mstEdges.some(
          (m) => (m.from === e.from && m.to === e.to) || (m.from === e.to && m.to === e.from)
        );
        return !inMST;
      })
      .map((e) => ({
        from: e.from, to: e.to,
        cost: e.cost, pressureLoss: e.pressureLoss,
        type: "reroute",
        stroke: "#EF9F27", strokeWidth: 2.5, dashArray: "7,3", opacity: 1,
      })),
  ];

  const mapNodes = nodes.map((n) => {
    const p = nodePressure[n.id] ?? 0;
    const isSource = n.id === SOURCE_NODE;
    const status =
      isSource       ? "source"   :
      p === null     ? "isolated" :
      p < MIN_PRESSURE     ? "critical"  :
      p < WARNING_PRESSURE ? "degraded"  : "healthy";

    return {
      ...n,
      pressure: p !== null ? +p.toFixed(2) : null,
      status,
      // Map visual hints
      fill:
        isSource         ? "#3B6D11"  :
        status === "critical"  ? "#E24B4A"  :
        status === "degraded"  ? "#BA7517"  :
        status === "isolated"  ? "#888780"  : "#185FA5",
      radius: isSource ? 11 : 7,
      label: p !== null ? `${p.toFixed(1)}b` : "?",
    };
  });

  return { mapEdges, mapNodes };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. MAIN EXPORT — normal pipeline layout
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Run Prim's MST to determine the optimal water pipeline layout.
 *
 * @param {Object[]} nodes   - [{ id, x, y, demand }]
 * @param {Edge[]}   edges   - full edge list (broken ones flagged with broken:true)
 * @param {number}   k       - pressure weighting (higher = prefer low pressure-loss routes)
 * @returns {MSTResult}
 */
export function computeWaterNetwork(nodes, edges, k = 1.5) {
  const activeEdges = edges.filter((e) => !e.broken);
  const adj = buildAdjacency(activeEdges);

  const { mstEdges, totalCost, totalPressureLoss, unreached } =
    primMST(adj, nodes, new Set(), k);

  const nodePressure = propagatePressure(mstEdges, nodes);

  // Collect warnings
  const warnings = [];
  const criticalZones  = [];
  const degradedZones  = [];

  for (const [id, p] of Object.entries(nodePressure)) {
    if (id === SOURCE_NODE) continue;
    if (p === null || p < MIN_PRESSURE)     { criticalZones.push(id);  warnings.push(`Zone ${id}: CRITICAL pressure ${p?.toFixed(2) ?? "N/A"} bar`); }
    else if (p < WARNING_PRESSURE)          { degradedZones.push(id);  warnings.push(`Zone ${id}: LOW pressure ${p.toFixed(2)} bar`); }
  }
  for (const id of unreached) warnings.push(`Zone ${id}: ISOLATED — not reachable from source`);

  const status =
    unreached.length > 0 || criticalZones.length > 0 ? "failed"   :
    degradedZones.length > 0                          ? "degraded" : "ok";

  const mapData = buildMapData(nodes, mstEdges, nodePressure, [], []);

  return {
    mstEdges, totalCost, totalPressureLoss,
    nodePressure, status, warnings,
    criticalZones, degradedZones, unreached,
    mapData,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. MAIN EXPORT — pipe burst / breakdown rerouting
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Handle a pipe breakdown: mark broken pipes, rerun MST on remaining edges,
 * find which zones lost pressure, and suggest reroute edges.
 *
 * @param {Object[]} nodes
 * @param {Edge[]}   edges
 * @param {string[]} brokenPipeIds  - ["from-to", ...] pairs that have failed
 * @param {number}   k
 * @returns {MSTResult & { brokenEdges, rerouteEdges, affectedZones }}
 */
export function handlePipeBurst(nodes, edges, brokenPipeIds = [], k = 1.5) {
  // 1. Mark broken edges
  const brokenSet = new Set(brokenPipeIds.flatMap((id) => [id, id.split("-").reverse().join("-")]));
  const updatedEdges = edges.map((e) => ({
    ...e,
    broken: e.broken || brokenSet.has(`${e.from}-${e.to}`) || brokenSet.has(`${e.to}-${e.from}`),
  }));

  const brokenEdges = updatedEdges.filter((e) => e.broken);
  const activeEdges = updatedEdges.filter((e) => !e.broken);

  // 2. Run MST without broken pipes
  const adj = buildAdjacency(activeEdges);
  const { mstEdges, totalCost, totalPressureLoss, unreached } =
    primMST(adj, nodes, brokenSet, k);

  // 3. Propagate pressure on new MST
  const nodePressure = propagatePressure(mstEdges, nodes);

  // 4. Find affected zones
  const affectedZones = [];
  const warnings = [`Pipe burst detected: ${brokenPipeIds.join(", ")}`];

  for (const [id, p] of Object.entries(nodePressure)) {
    if (id === SOURCE_NODE) continue;
    if (p === null || p < MIN_PRESSURE) {
      affectedZones.push(id);
      warnings.push(`Zone ${id}: pressure dropped to ${p?.toFixed(2) ?? "N/A"} bar — CRITICAL`);
    } else if (p < WARNING_PRESSURE) {
      affectedZones.push(id);
      warnings.push(`Zone ${id}: pressure ${p.toFixed(2)} bar — degraded`);
    }
  }
  for (const id of unreached) {
    affectedZones.push(id);
    warnings.push(`Zone ${id}: ISOLATED after burst — emergency reroute required`);
  }

  // 5. Find reroute edges — best alternate path for each isolated/critical zone
  const rerouteEdges = findRerouteEdges(nodes, activeEdges, affectedZones, nodePressure);
  if (rerouteEdges.length > 0) warnings.push(`Reroute proposed via: ${rerouteEdges.map((e) => `${e.from}→${e.to}`).join(", ")}`);

  const status =
    unreached.length > 0 || affectedZones.some((id) => (nodePressure[id] ?? 0) < MIN_PRESSURE)
      ? "failed" : "degraded";

  const mapData = buildMapData(nodes, mstEdges, nodePressure, brokenEdges, rerouteEdges);

  return {
    mstEdges, totalCost, totalPressureLoss,
    nodePressure, status, warnings,
    brokenEdges, rerouteEdges,
    affectedZones, unreached,
    mapData,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Helper — find best reroute edges for affected zones (Dijkstra by pressure)
// ─────────────────────────────────────────────────────────────────────────────
function findRerouteEdges(nodes, activeEdges, affectedZones, currentPressure) {
  if (affectedZones.length === 0) return [];

  // Build full adjacency from all active edges
  const adj = buildAdjacency(activeEdges);
  const rerouteEdges = [];
  const added = new Set();

  for (const zoneId of affectedZones) {
    // Find the healthy neighbor with highest pressure reachable by one hop
    const neighbors = adj[zoneId] || [];
    let best = null;
    let bestPressure = -1;

    for (const n of neighbors) {
      const p = currentPressure[n.to] ?? 0;
      if (p >= WARNING_PRESSURE && p > bestPressure) {
        bestPressure = p;
        best = n;
      }
    }

    if (best) {
      const key = [zoneId, best.to].sort().join("-");
      if (!added.has(key)) {
        added.add(key);
        rerouteEdges.push({
          from: zoneId, to: best.to,
          cost: best.cost,
          pressureLoss: best.pressureLoss,
          capacity: best.capacity,
          isEmergencyReroute: true,
        });
      }
    }
  }

  return rerouteEdges;
}