import { useState, useEffect, useCallback } from "react";
import { computeWaterNetwork, handlePipeBurst } from "@/modes/waterAlgorithm";

// ── Static node/edge definitions for the water network ───────────────────────
const WATER_NODES = [
  { id: "TP", x: 50,  y: 130, label: "Treatment Plant", demand: 0 },
  { id: "Z1", x: 150, y: 48,  label: "Zone 1",  demand: 120 },
  { id: "Z2", x: 268, y: 30,  label: "Zone 2",  demand: 95  },
  { id: "Z3", x: 385, y: 52,  label: "Zone 3",  demand: 110 },
  { id: "Z4", x: 468, y: 142, label: "Zone 4",  demand: 80  },
  { id: "Z5", x: 385, y: 200, label: "Zone 5",  demand: 90  },
  { id: "Z6", x: 250, y: 210, label: "Zone 6",  demand: 100 },
  { id: "Z7", x: 122, y: 200, label: "Zone 7",  demand: 75  },
  { id: "Z8", x: 210, y: 130, label: "Zone 8",  demand: 115 },
  { id: "Z9", x: 345, y: 128, label: "Zone 9",  demand: 85  },
];

const WATER_EDGES = [
  { from: "TP", to: "Z1", cost: 3, pressureLoss: 0.5, capacity: 300 },
  { from: "Z1", to: "Z2", cost: 4, pressureLoss: 0.2, capacity: 200 },
  { from: "Z2", to: "Z3", cost: 3, pressureLoss: 0.2, capacity: 200 },
  { from: "Z3", to: "Z4", cost: 4, pressureLoss: 0.2, capacity: 150 },
  { from: "Z4", to: "Z5", cost: 3, pressureLoss: 0.1, capacity: 150 },
  { from: "Z5", to: "Z6", cost: 4, pressureLoss: 0.2, capacity: 180 },
  { from: "Z6", to: "Z7", cost: 3, pressureLoss: 0.2, capacity: 160 },
  { from: "Z7", to: "TP", cost: 4, pressureLoss: 0.6, capacity: 200 },
  { from: "Z8", to: "Z1", cost: 3, pressureLoss: 0.2, capacity: 220 },
  { from: "Z8", to: "Z6", cost: 4, pressureLoss: 0.3, capacity: 180 },
  { from: "Z9", to: "Z3", cost: 3, pressureLoss: 0.2, capacity: 170 },
  { from: "Z9", to: "Z5", cost: 4, pressureLoss: 0.2, capacity: 160 },
  { from: "TP", to: "Z8", cost: 2, pressureLoss: 0.3, capacity: 280 },
];

export function useWaterMode({ mode, addAlert, clearModeAlerts }) {
  const [burstActive,    setBurstActive]    = useState(false);
  const [brokenPipes,    setBrokenPipes]    = useState([]);       // ["Z6-Z7", ...]
  const [networkResult,  setNetworkResult]  = useState(null);     // full algorithm output
  const [edges,          setEdges]          = useState(WATER_EDGES);

  // ── Run normal MST on mount ───────────────────────────────────────────────
  useEffect(() => {
    const result = computeWaterNetwork(WATER_NODES, WATER_EDGES, 1.5);
    setNetworkResult(result);
  }, []);

  // ── Simulate a pipe burst on Z6-Z7 and Z7-TP ─────────────────────────────
  const handleSimulateBurst = useCallback(() => {
    if (mode !== "water") return;

    const burstIds = ["Z6-Z7", "Z7-TP"];
    setBurstActive(true);
    setBrokenPipes(burstIds);

    const result = handlePipeBurst(WATER_NODES, WATER_EDGES, burstIds, 1.5);
    setNetworkResult(result);

    // Fire alerts from warnings
    result.warnings.forEach((msg) =>
      addAlert({ mode: "water", type: "critical", message: msg })
    );

    if (result.rerouteEdges.length > 0) {
      addAlert({
        mode: "water",
        type: "info",
        message: `Emergency reroute: ${result.rerouteEdges.map((e) => `${e.from}→${e.to}`).join(", ")}`,
      });
    }
  }, [mode, addAlert]);

  // ── Reset to normal network ───────────────────────────────────────────────
  const handleResetWater = useCallback(() => {
    setBurstActive(false);
    setBrokenPipes([]);
    clearModeAlerts("water");

    const result = computeWaterNetwork(WATER_NODES, WATER_EDGES, 1.5);
    setNetworkResult(result);
  }, [clearModeAlerts]);

  // ── Derived values for ModePage / MetricsPanel ────────────────────────────
  const nodePressure  = networkResult?.nodePressure  ?? {};
  const zonePressures = nodePressure;                             // full map { Z1: 3.5, ... }
  const z7Pressure    = nodePressure["Z7"] ?? 1.4;
  const mapData       = networkResult?.mapData       ?? null;     // { mapEdges, mapNodes }
  const networkStatus = networkResult?.status        ?? "ok";     // "ok" | "degraded" | "failed"
  const rerouteEdges  = networkResult?.rerouteEdges  ?? [];
  const affectedZones = networkResult?.affectedZones ?? [];

  return {
    // existing surface (ModePage uses these)
    burstActive,
    zonePressures,
    z7Pressure,
    handleSimulateBurst,
    handleResetWater,
    // new — pass these to MapView / MetricsPanel
    waterNodes:   WATER_NODES,
    waterEdges:   edges,
    mapData,
    networkStatus,
    rerouteEdges,
    affectedZones,
    brokenPipes,
  };
}