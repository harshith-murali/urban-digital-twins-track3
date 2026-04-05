/**
 * UrbanTwins — Shared City Graph
 * Single underlying graph reused across all 4 simulation modes.
 * Edge weights & node semantics shift per mode.
 */

export const CITY_NODES = [
  // id, label, lat/lng (Bengaluru-inspired coords for demo), type
  { id: "N1", label: "Central Hub", lat: 12.9716, lng: 77.5946, type: "hub" },
  {
    id: "N2",
    label: "North Junction",
    lat: 13.01,
    lng: 77.5946,
    type: "junction",
  },
  {
    id: "N3",
    label: "South Junction",
    lat: 12.92,
    lng: 77.5946,
    type: "junction",
  },
  {
    id: "N4",
    label: "East Junction",
    lat: 12.9716,
    lng: 77.65,
    type: "junction",
  },
  {
    id: "N5",
    label: "West Junction",
    lat: 12.9716,
    lng: 77.52,
    type: "junction",
  },
  { id: "N6", label: "Airport Zone", lat: 13.1986, lng: 77.7066, type: "zone" },
  {
    id: "N7",
    label: "Industrial Zone",
    lat: 12.8399,
    lng: 77.677,
    type: "zone",
  },
  {
    id: "N8",
    label: "Residential Zone",
    lat: 13.0358,
    lng: 77.597,
    type: "zone",
  },
  {
    id: "N9",
    label: "Commercial Zone",
    lat: 12.9165,
    lng: 77.6229,
    type: "zone",
  },
  { id: "N10", label: "Tech Park", lat: 12.9698, lng: 77.75, type: "zone" },
];

export const CITY_EDGES = [
  { id: "E1", from: "N1", to: "N2", baseWeight: 5, capacity: 100 },
  { id: "E2", from: "N1", to: "N3", baseWeight: 7, capacity: 80 },
  { id: "E3", from: "N1", to: "N4", baseWeight: 4, capacity: 120 },
  { id: "E4", from: "N1", to: "N5", baseWeight: 6, capacity: 90 },
  { id: "E5", from: "N2", to: "N8", baseWeight: 3, capacity: 70 },
  { id: "E6", from: "N2", to: "N6", baseWeight: 12, capacity: 60 },
  { id: "E7", from: "N3", to: "N9", baseWeight: 4, capacity: 85 },
  { id: "E8", from: "N3", to: "N7", baseWeight: 8, capacity: 75 },
  { id: "E9", from: "N4", to: "N10", baseWeight: 6, capacity: 110 },
  { id: "E10", from: "N4", to: "N9", baseWeight: 5, capacity: 95 },
  { id: "E11", from: "N5", to: "N8", baseWeight: 9, capacity: 65 },
  { id: "E12", from: "N5", to: "N7", baseWeight: 11, capacity: 55 },
  { id: "E13", from: "N6", to: "N10", baseWeight: 7, capacity: 50 },
  { id: "E14", from: "N7", to: "N9", baseWeight: 3, capacity: 100 },
  { id: "E15", from: "N8", to: "N10", baseWeight: 5, capacity: 80 },
];

/**
 * Build adjacency list from edge list.
 * @param {Array} edges - edge array with current weights
 * @param {Set} blockedNodes - nodes to exclude
 */
export function buildAdjacencyList(edges, blockedNodes = new Set()) {
  const adj = {};
  for (const node of CITY_NODES) {
    if (!blockedNodes.has(node.id)) adj[node.id] = [];
  }
  for (const edge of edges) {
    if (
      !blockedNodes.has(edge.from) &&
      !blockedNodes.has(edge.to) &&
      !edge.isBlocked
    ) {
      adj[edge.from]?.push({
        to: edge.to,
        weight: edge.weight ?? edge.baseWeight,
        edgeId: edge.id,
      });
      // undirected for water/energy
      if (edge.undirected) {
        adj[edge.to]?.push({
          to: edge.from,
          weight: edge.weight ?? edge.baseWeight,
          edgeId: edge.id,
        });
      }
    }
  }
  return adj;
}

export const cityGraph = {
  nodes: CITY_NODES.map((n) => ({
    ...n,
    load: Math.floor(Math.random() * 40) + 30,
    isBlocked: false,
  })),
  edges: CITY_EDGES.map((e) => ({ ...e, isBlocked: false })),
};
