"use client";
import { useState, useCallback } from "react";
import { dijkstra } from "@/modes/disaster";

/**
 * Manages all Dijkstra routing state and interaction logic.
 *
 * @param {object} graph       - current city graph
 * @param {object} currentMode - the active MODES entry (has sourceCanBeBlocked etc.)
 */
export function useRouting(graph, currentMode) {
  const [start, setStart]               = useState(null);
  const [end, setEnd]                   = useState(null);
  const [path, setPath]                 = useState([]);
  const [pathError, setPathError]       = useState("");
  const [routeHistory, setRouteHistory] = useState([]);

  /** Core Dijkstra call — validates blocked-node rules then runs algorithm. */
  const runRoute = useCallback(
    (srcId, dstId, g) => {
      const { sourceCanBeBlocked, destCanBeBlocked } = currentMode;
      const blockedNodes = g.nodes.filter((n) => n.isBlocked).map((n) => n.id);

      if (blockedNodes.includes(srcId) && !sourceCanBeBlocked)
        return { path: [], error: `Cannot route FROM a blocked node in ${currentMode.label} mode.` };

      if (blockedNodes.includes(dstId) && !destCanBeBlocked)
        return { path: [], error: `Cannot route TO a flooded/blocked node in ${currentMode.label} mode.` };

      const result = dijkstra(g, srcId, dstId, blockedNodes);
      if (!result || result.length === 0) {
        const srcLabel = g.nodes.find((n) => n.id === srcId)?.label;
        const dstLabel = g.nodes.find((n) => n.id === dstId)?.label;
        return { path: [], error: `No route from ${srcLabel} to ${dstLabel}.` };
      }
      return { path: result, error: "" };
    },
    [currentMode]
  );

  const pushHistory = (srcId, dstId, result, g, mode) => {
    setRouteHistory((prev) => [
      {
        from: g.nodes.find((n) => n.id === srcId)?.label,
        to:   g.nodes.find((n) => n.id === dstId)?.label,
        path: result,
        mode,
        time: new Date().toLocaleTimeString(),
      },
      ...prev.slice(0, 19),
    ]);
  };

  /** Called when the user clicks a map node. First click = origin, second = destination. */
  const handleNodeClick = (nodeId, mode) => {
    setPathError("");
    if (!start) {
      setStart(nodeId);
      setEnd(null);
      setPath([]);
      return;
    }
    if (nodeId === start) {
      setStart(null);
      setPath([]);
      return;
    }
    const { path: result, error } = runRoute(start, nodeId, graph);
    if (error) {
      setPathError(error);
      setPath([]);
    } else {
      setPath(result);
      setEnd(nodeId);
      pushHistory(start, nodeId, result, graph, mode);
    }
    setStart(null);
  };

  /** Picks two random unblocked nodes and routes between them. */
  const runAutoRoute = (mode) => {
    setPathError("");
    const active = graph.nodes.filter((n) => !n.isBlocked);
    if (active.length < 2) {
      setPathError("Not enough active nodes.");
      return;
    }
    const shuffled = [...active].sort(() => Math.random() - 0.5);
    const src = shuffled[0].id;
    const dst = shuffled[1].id;
    const { path: result, error } = runRoute(src, dst, graph);
    if (error) {
      setPathError(error);
    } else {
      setPath(result);
      setEnd(dst);
      pushHistory(src, dst, result, graph, mode);
    }
    setStart(null);
  };

  const clearPath = () => {
    setPath([]);
    setStart(null);
    setEnd(null);
    setPathError("");
  };

  return {
    start, end, path, pathError, routeHistory,
    handleNodeClick, runAutoRoute, clearPath,
  };
}