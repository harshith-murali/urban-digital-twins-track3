"use client";
import { useState, useEffect } from "react";
import { cloneGraph } from "@/lib/graphUtils";
import { cityGraph } from "@/data/cityGraph";

const INITIAL_LOADS = { SA: 93, SB: 78, SC: 65, SD: 48, SE: 55, SF: 38, SG: 71 };

/**
 * Manages Energy-mode state: live station loads, substation failure simulation.
 *
 * @param {string}   mode             - current active mode (effect only runs in "energy")
 * @param {Function} setGraph         - setter for the shared graph state
 * @param {Function} clearPath        - clears current routing path
 * @param {Function} addAlert         - adds an entry to the alert log
 * @param {Function} clearModeAlerts  - removes alerts for a given mode
 */
export function useEnergyMode({ mode, setGraph, clearPath, addAlert, clearModeAlerts }) {
  const [failedStation, setFailedStation] = useState(null);
  const [stationLoads, setStationLoads]   = useState(INITIAL_LOADS);

  // Fluctuate station loads every 5 s when in energy mode
  useEffect(() => {
    if (mode !== "energy") return;
    const iv = setInterval(() => {
      setStationLoads((l) =>
        Object.fromEntries(
          Object.entries(l).map(([k, v]) => {
            const next = v + (Math.random() - 0.5) * 6;
            return [k, Math.max(30, Math.min(98, Math.floor(next)))];
          })
        )
      );
    }, 5000);
    return () => clearInterval(iv);
  }, [mode]);

  const handleSimulateFailure = () => {
    setFailedStation("SA");
    setStationLoads((l) => ({ ...l, SD: 76, SE: 82, SF: 61 }));
    setGraph((prev) => {
      const next = cloneGraph(prev);
      const node = next.nodes.find((n) => n.id === "A");
      if (node) node.isBlocked = true;
      return next;
    });
    addAlert({
      id:    "SA",
      label: "MG Road Sub failure — load redistributed",
      load:  98,
      mode:  "energy",
      time:  new Date().toLocaleTimeString(),
    });
  };

  const handleResetEnergy = () => {
    setFailedStation(null);
    setStationLoads(INITIAL_LOADS);
    setGraph(cloneGraph(cityGraph));
    clearPath();
    clearModeAlerts("energy");
  };

  const avgStationLoad = Math.round(
    Object.values(stationLoads).reduce((a, b) => a + b, 0) /
      Object.keys(stationLoads).length
  );

  return {
    failedStation,
    stationLoads,
    avgStationLoad,
    handleSimulateFailure,
    handleResetEnergy,
  };
}