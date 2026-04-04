"use client";
import { useState } from "react";
import { cloneGraph } from "@/lib/graphUtils";
import { triggerFlood } from "@/modes/disaster";
import { cityGraph } from "@/data/cityGraph";

/**
 * Manages Disaster-mode state: flood simulation and reset.
 *
 * @param {Function} setGraph         - setter for the shared graph state
 * @param {Function} clearPath        - clears current routing path
 * @param {Function} addAlert         - adds an entry to the alert log
 * @param {Function} clearModeAlerts  - removes alerts for a given mode
 */
export function useDisasterMode({ setGraph, clearPath, addAlert, clearModeAlerts }) {
  const [floodActive, setFloodActive] = useState(false);

  const handleTriggerFlood = async () => {
    const allIds = cityGraph.nodes.map((n) => n.id);
    const zones  = [...allIds]
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 3) + 2);

    setFloodActive(true);
    setGraph((prev) => {
      const next = cloneGraph(prev);
      triggerFlood(next, zones, []);
      return next;
    });
    clearPath();

    addAlert({
      id:    "flood",
      label: `Flood — zones ${zones.join(", ")}`,
      load:  100,
      mode:  "disaster",
      time:  new Date().toLocaleTimeString(),
    });

    try {
      await fetch("/api/incidents", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode:        "disaster",
          zone:        `Zones ${zones.join(", ")}`,
          severity:    "critical",
          load:        100,
          description: `Flood triggered — zones ${zones.join(", ")} blocked`,
        }),
      });
    } catch (err) {
      console.error("Failed to log incident:", err);
    }
  };

  const handleResetFlood = async () => {
    setFloodActive(false);
    setGraph(cloneGraph(cityGraph));
    clearPath();
    clearModeAlerts("disaster");

    try {
      await fetch("/api/incidents", { method: "DELETE" });
    } catch (err) {
      console.error("Failed to clear incidents:", err);
    }
  };

  return { floodActive, handleTriggerFlood, handleResetFlood };
}