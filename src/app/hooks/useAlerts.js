"use client";
import { useState, useEffect } from "react";

/**
 * Manages the incident alert log.
 * Auto-fires an alert whenever a node's load exceeds 80.
 *
 * @param {object} graph   - current city graph (nodes watched for high load)
 * @param {string} mode    - current infrastructure mode label
 */
export function useAlerts(graph, mode) {
  const [alerts, setAlerts] = useState([]);

  // Auto-generate alert when any node crosses 80% load
  useEffect(() => {
    graph.nodes.forEach((n) => {
      if (n.load > 80) {
        setAlerts((prev) => {
          // Debounce: skip if same node alerted within last 15 s
          if (prev.find((a) => a.id === n.id && Date.now() - a.ts < 15000))
            return prev;
          return [
            {
              id:    n.id,
              label: n.label,
              load:  Math.round(n.load),
              mode,
              time:  new Date().toLocaleTimeString(),
              ts:    Date.now(),
            },
            ...prev.slice(0, 49),
          ];
        });
      }
    });
  }, [graph, mode]);

  /** Prepend a custom alert object to the log. */
  const addAlert = (alert) =>
    setAlerts((prev) => [{ ...alert, ts: Date.now() }, ...prev.slice(0, 49)]);

  /** Remove all alerts belonging to a specific mode. */
  const clearModeAlerts = (m) =>
    setAlerts((prev) => prev.filter((a) => a.mode !== m));

  return { alerts, addAlert, clearModeAlerts };
}