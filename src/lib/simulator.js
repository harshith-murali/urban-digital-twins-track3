/**
 * UrbanTwins — Real-Time Simulation Engine
 * Generates live-updating metric snapshots for all 4 city modes.
 * Designed to be called by setInterval every 5 seconds.
 *
 * Each simulator returns a snapshot object that your UI layer
 * can diff and apply to React state.
 */

import { CITY_NODES, CITY_EDGES } from "../data/cityGraph.js";

// ─── Shared helpers ────────────────────────────────────────────────────────────

/** Clamp a number between min and max. */
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

/** Gaussian-ish random: average of N uniform samples. */
const gaussRandom = (mean, stdDev) => {
  let s = 0;
  for (let i = 0; i < 6; i++) s += Math.random();
  return mean + (s - 3) * stdDev;
};

/** Drift a value by ±delta, clamped to [min, max]. */
const drift = (current, delta, min, max) =>
  clamp(current + (Math.random() - 0.5) * 2 * delta, min, max);

// ─── Traffic Simulator ─────────────────────────────────────────────────────────

let _trafficState = null;

function initTrafficState() {
  const nodeMetrics = {};
  const edgeMetrics = {};

  for (const n of CITY_NODES) {
    nodeMetrics[n.id] = {
      vehicles: Math.floor(gaussRandom(120, 40)),
      avgSpeed: Math.floor(gaussRandom(45, 15)),   // km/h
      congestion: Math.floor(Math.random() * 60),  // 0-100 %
    };
  }
  for (const e of CITY_EDGES) {
    edgeMetrics[e.id] = {
      congestion: Math.floor(Math.random() * 70),  // 0-100 %
      vehicles: Math.floor(gaussRandom(60, 20)),
    };
  }
  return { nodeMetrics, edgeMetrics };
}

export function simulateTraffic(prevState = _trafficState) {
  if (!prevState) prevState = initTrafficState();

  const nodeMetrics = {};
  const edgeMetrics = {};
  const alerts = [];

  for (const n of CITY_NODES) {
    const prev = prevState.nodeMetrics[n.id];
    const congestion = clamp(drift(prev.congestion, 8, 0, 100), 0, 100);
    const vehicles   = clamp(drift(prev.vehicles, 15, 0, 500), 0, 500);
    const avgSpeed   = clamp(100 - congestion * 0.8, 5, 120);

    nodeMetrics[n.id] = { vehicles: Math.round(vehicles), avgSpeed: Math.round(avgSpeed), congestion: Math.round(congestion) };

    if (congestion > 80) {
      alerts.push({
        id: `traffic-${n.id}-${Date.now()}`,
        mode: "traffic",
        severity: "CRITICAL",
        zone: n.label,
        message: `Severe congestion at ${n.label} — ${Math.round(congestion)}% blocked`,
        timestamp: new Date().toISOString(),
        aiPrompt: `Traffic congestion detected at ${n.label}. Vehicle count: ${Math.round(vehicles)}, avg speed: ${Math.round(avgSpeed)} km/h. Suggest 3 actionable urban traffic management steps.`,
      });
    }
  }

  for (const e of CITY_EDGES) {
    const prev = prevState.edgeMetrics[e.id];
    const congestion = clamp(
      (nodeMetrics[e.from].congestion + nodeMetrics[e.to].congestion) / 2 +
        (Math.random() - 0.5) * 10,
      0, 100
    );
    edgeMetrics[e.id] = {
      congestion: Math.round(congestion),
      vehicles: Math.round(drift(prev.vehicles, 10, 0, 300)),
      weight: e.baseWeight * (1 + congestion / 100), // heavier when congested
    };
  }

  const snapshot = {
    mode: "traffic",
    timestamp: new Date().toISOString(),
    nodeMetrics,
    edgeMetrics,
    alerts,
    summary: {
      totalVehicles: Object.values(nodeMetrics).reduce((s, m) => s + m.vehicles, 0),
      avgCongestion: Math.round(
        Object.values(nodeMetrics).reduce((s, m) => s + m.congestion, 0) /
          CITY_NODES.length
      ),
      avgSpeed: Math.round(
        Object.values(nodeMetrics).reduce((s, m) => s + m.avgSpeed, 0) /
          CITY_NODES.length
      ),
    },
  };

  _trafficState = { nodeMetrics, edgeMetrics };
  return snapshot;
}

// ─── Energy Simulator ──────────────────────────────────────────────────────────

let _energyState = null;

function initEnergyState() {
  const nodeMetrics = {};
  for (const n of CITY_NODES) {
    nodeMetrics[n.id] = {
      load: Math.floor(gaussRandom(55, 20)),    // %
      voltage: Math.floor(gaussRandom(220, 10)), // V
      isDown: false,
    };
  }
  return { nodeMetrics };
}

export function simulateEnergy(prevState = _energyState, failedNode = null) {
  if (!prevState) prevState = initEnergyState();

  const nodeMetrics = {};
  const alerts = [];

  for (const n of CITY_NODES) {
    let { load, voltage } = prevState.nodeMetrics[n.id];
    const isDown = n.id === failedNode;

    if (isDown) {
      load = 0; voltage = 0;
    } else {
      // Absorb load from failed node (if adjacent)
      const isAdjacentToFailed = failedNode &&
        CITY_EDGES.some(
          e => (e.from === n.id && e.to === failedNode) || (e.to === n.id && e.from === failedNode)
        );
      load = clamp(drift(load, 6, 0, 100) + (isAdjacentToFailed ? 12 : 0), 0, 100);
      voltage = clamp(drift(voltage, 5, 180, 250), 180, 250);
    }

    nodeMetrics[n.id] = { load: Math.round(load), voltage: Math.round(voltage), isDown };

    if (load > 80 && !isDown) {
      alerts.push({
        id: `energy-${n.id}-${Date.now()}`,
        mode: "energy",
        severity: load > 90 ? "CRITICAL" : "WARNING",
        zone: n.label,
        message: `Power overload at ${n.label} — ${Math.round(load)}% capacity`,
        timestamp: new Date().toISOString(),
        aiPrompt: `Power station ${n.label} is at ${Math.round(load)}% capacity during peak hours. Suggest load balancing strategies for a city of 2 million people.`,
      });
    }
    if (isDown) {
      alerts.push({
        id: `energy-down-${n.id}-${Date.now()}`,
        mode: "energy",
        severity: "CRITICAL",
        zone: n.label,
        message: `Station FAILURE at ${n.label} — redistributing load`,
        timestamp: new Date().toISOString(),
        aiPrompt: `Station ${n.label} has gone offline. Suggest emergency load redistribution protocol.`,
      });
    }
  }

  const activeNodes = Object.values(nodeMetrics).filter(m => !m.isDown);
  const snapshot = {
    mode: "energy",
    timestamp: new Date().toISOString(),
    nodeMetrics,
    alerts,
    summary: {
      avgLoad: Math.round(activeNodes.reduce((s, m) => s + m.load, 0) / (activeNodes.length || 1)),
      peakLoad: Math.max(...activeNodes.map(m => m.load)),
      stationsDown: Object.values(nodeMetrics).filter(m => m.isDown).length,
      totalCapacity: CITY_NODES.length * 100,
      usedCapacity: activeNodes.reduce((s, m) => s + m.load, 0),
    },
  };

  _energyState = { nodeMetrics };
  return snapshot;
}

// ─── Water Simulator ───────────────────────────────────────────────────────────

let _waterState = null;

function initWaterState() {
  const nodeMetrics = {};
  for (const n of CITY_NODES) {
    nodeMetrics[n.id] = {
      pressure: Math.floor(gaussRandom(65, 15)), // PSI (0-100 normalized)
      consumption: Math.floor(gaussRandom(50, 20)), // ML/day
      hasBurst: false,
    };
  }
  return { nodeMetrics };
}

export function simulateWater(prevState = _waterState, burstZone = null) {
  if (!prevState) prevState = initWaterState();

  const nodeMetrics = {};
  const alerts = [];

  for (const n of CITY_NODES) {
    let { pressure, consumption } = prevState.nodeMetrics[n.id];
    const hasBurst = n.id === burstZone;

    if (hasBurst) {
      pressure = clamp(pressure - 35, 0, 100); // sudden pressure drop
    } else {
      const isAdjacentToBurst = burstZone &&
        CITY_EDGES.some(
          e => (e.from === n.id && e.to === burstZone) || (e.to === n.id && e.from === burstZone)
        );
      pressure = clamp(drift(pressure, 5, 0, 100) - (isAdjacentToBurst ? 15 : 0), 0, 100);
      consumption = clamp(drift(consumption, 8, 0, 200), 0, 200);
    }

    nodeMetrics[n.id] = { pressure: Math.round(pressure), consumption: Math.round(consumption), hasBurst };

    if (pressure < 30 || hasBurst) {
      alerts.push({
        id: `water-${n.id}-${Date.now()}`,
        mode: "water",
        severity: hasBurst || pressure < 20 ? "CRITICAL" : "WARNING",
        zone: n.label,
        message: hasBurst
          ? `Pipe burst in ${n.label} — pressure at ${Math.round(pressure)} PSI`
          : `Low pressure in ${n.label} — ${Math.round(pressure)} PSI`,
        timestamp: new Date().toISOString(),
        aiPrompt: `Water pressure in ${n.label} has dropped to ${Math.round(pressure)} PSI. ${hasBurst ? "A pipe burst has been detected." : ""} Suggest emergency water management steps.`,
      });
    }
  }

  const snapshot = {
    mode: "water",
    timestamp: new Date().toISOString(),
    nodeMetrics,
    alerts,
    summary: {
      avgPressure: Math.round(
        Object.values(nodeMetrics).reduce((s, m) => s + m.pressure, 0) / CITY_NODES.length
      ),
      minPressure: Math.min(...Object.values(nodeMetrics).map(m => m.pressure)),
      totalConsumption: Object.values(nodeMetrics).reduce((s, m) => s + m.consumption, 0),
      burstZones: Object.values(nodeMetrics).filter(m => m.hasBurst).length,
    },
  };

  _waterState = { nodeMetrics };
  return snapshot;
}

// ─── Disaster Simulator ────────────────────────────────────────────────────────

let _disasterState = null;

function initDisasterState() {
  const nodeMetrics = {};
  for (const n of CITY_NODES) {
    nodeMetrics[n.id] = {
      riskLevel: Math.floor(Math.random() * 40), // 0-100
      isFlooded: false,
      population: Math.floor(gaussRandom(50000, 20000)),
      evacuated: 0,
    };
  }
  return { nodeMetrics };
}

export function simulateDisaster(prevState = _disasterState, floodedZones = []) {
  if (!prevState) prevState = initDisasterState();

  const nodeMetrics = {};
  const alerts = [];

  for (const n of CITY_NODES) {
    const prev = prevState.nodeMetrics[n.id];
    const isFlooded = floodedZones.includes(n.id);
    let riskLevel = isFlooded ? 100 : clamp(drift(prev.riskLevel, 5, 0, 100), 0, 100);

    // Adjacency spread of risk
    const adjacentFlooded = CITY_EDGES.filter(
      e => floodedZones.includes(e.from) || floodedZones.includes(e.to)
    ).some(e => e.from === n.id || e.to === n.id);
    if (adjacentFlooded && !isFlooded) riskLevel = clamp(riskLevel + 20, 0, 100);

    const population = prev.population;
    const evacuated = isFlooded
      ? clamp(prev.evacuated + Math.floor(population * 0.15), 0, population)
      : prev.evacuated;

    nodeMetrics[n.id] = { riskLevel: Math.round(riskLevel), isFlooded, population, evacuated };

    if (isFlooded) {
      alerts.push({
        id: `disaster-flood-${n.id}-${Date.now()}`,
        mode: "disaster",
        severity: "CRITICAL",
        zone: n.label,
        message: `FLOOD EVENT in ${n.label} — ${population.toLocaleString()} residents at risk`,
        timestamp: new Date().toISOString(),
        aiPrompt: `A flood event has been triggered in ${n.label} affecting ${population.toLocaleString()} residents. Suggest immediate evacuation routes and emergency response protocol.`,
      });
    } else if (riskLevel > 70) {
      alerts.push({
        id: `disaster-risk-${n.id}-${Date.now()}`,
        mode: "disaster",
        severity: "WARNING",
        zone: n.label,
        message: `High flood risk in ${n.label} — risk index ${Math.round(riskLevel)}%`,
        timestamp: new Date().toISOString(),
        aiPrompt: `${n.label} shows high flood risk at ${Math.round(riskLevel)}%. Recommend pre-emptive evacuation steps.`,
      });
    }
  }

  const snapshot = {
    mode: "disaster",
    timestamp: new Date().toISOString(),
    nodeMetrics,
    floodedZones,
    alerts,
    summary: {
      floodedCount: floodedZones.length,
      totalAtRisk: Object.values(nodeMetrics)
        .filter(m => m.isFlooded || m.riskLevel > 70)
        .reduce((s, m) => s + m.population, 0),
      totalEvacuated: Object.values(nodeMetrics).reduce((s, m) => s + m.evacuated, 0),
      avgRisk: Math.round(
        Object.values(nodeMetrics).reduce((s, m) => s + m.riskLevel, 0) / CITY_NODES.length
      ),
    },
  };

  _disasterState = { nodeMetrics };
  return snapshot;
}

// ─── Unified tick function ─────────────────────────────────────────────────────

/**
 * Call this every 5 seconds from your setInterval.
 * Returns a snapshot for the active mode only (keeps compute cheap).
 *
 * @param {"traffic"|"energy"|"water"|"disaster"} mode
 * @param {object} params  - mode-specific override params
 *   traffic:  {}
 *   energy:   { failedNode: "N3" | null }
 *   water:    { burstZone: "N7" | null }
 *   disaster: { floodedZones: ["N2", "N8"] }
 */
export function tick(mode, params = {}) {
  switch (mode) {
    case "traffic":  return simulateTraffic();
    case "energy":   return simulateEnergy(null, params.failedNode ?? null);
    case "water":    return simulateWater(null, params.burstZone ?? null);
    case "disaster": return simulateDisaster(null, params.floodedZones ?? []);
    default: throw new Error(`Unknown mode: ${mode}`);
  }
}