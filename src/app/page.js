"use client";
import dynamic from "next/dynamic";
import { useState, useEffect, useCallback } from "react";
import { cityGraph } from "@/data/cityGraph";
import { dijkstra, triggerFlood } from "@/modes/traffic";
import { UserButton } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Zap, Droplets, AlertTriangle,
  FileText, History, GitBranch, Moon, Sun,
  RefreshCw, X, ChevronRight, AlertCircle,
  Navigation, Radio, Cpu, BarChart3, Shield,
  MapPin, Gauge, Waves, Building2, Bus,
} from "lucide-react";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

// ─── Mode config ──────────────────────────────────────────────────────────────
const MODES = [
  {
    id: "traffic",
    label: "Traffic",
    icon: Activity,
    accent: "#22c55e",
    accentBg: "rgba(34,197,94,0.10)",
    accentBorder: "rgba(34,197,94,0.25)",
    sourceCanBeBlocked: false,
    destCanBeBlocked: false,
  },
  {
    id: "energy",
    label: "Energy",
    icon: Zap,
    accent: "#f59e0b",
    accentBg: "rgba(245,158,11,0.10)",
    accentBorder: "rgba(245,158,11,0.25)",
    sourceCanBeBlocked: false,
    destCanBeBlocked: true,
  },
  {
    id: "water",
    label: "Water",
    icon: Droplets,
    accent: "#38bdf8",
    accentBg: "rgba(56,189,248,0.10)",
    accentBorder: "rgba(56,189,248,0.25)",
    sourceCanBeBlocked: false,
    destCanBeBlocked: false,
  },
  {
    id: "disaster",
    label: "Disaster",
    icon: AlertTriangle,
    accent: "#ef4444",
    accentBg: "rgba(239,68,68,0.10)",
    accentBorder: "rgba(239,68,68,0.25)",
    sourceCanBeBlocked: true,
    destCanBeBlocked: false,
  },
];

const cloneGraph = (g) => ({
  nodes: g.nodes.map((n) => ({ ...n })),
  edges: g.edges.map((e) => ({ ...e })),
});

export default function Home() {
  const [mode, setMode] = useState("traffic");
  const [graph, setGraph] = useState(() => cloneGraph(cityGraph));
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [path, setPath] = useState([]);
  const [pathError, setPathError] = useState("");
  const [alerts, setAlerts] = useState([]);
  const [advice, setAdvice] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [dark, setDark] = useState(true);
  const [time, setTime] = useState("");
  const [sidePanel, setSidePanel] = useState(null);
  const [routeHistory, setRouteHistory] = useState([]);

  // ── Mode-specific state ───────────────────────────────────────────────────
  // Disaster
  const [floodActive, setFloodActive] = useState(false);
  // Energy
  const [failedStation, setFailedStation] = useState(null);
  const [stationLoads, setStationLoads] = useState({
    SA: 93, SB: 78, SC: 65, SD: 48, SE: 55, SF: 38, SG: 71,
  });
  // Water
  const [burstActive, setBurstActive] = useState(false);
  const [zonePressures, setZonePressures] = useState({
    Z1: 3.4, Z3: 3.0, Z7: 1.4, Z8: 3.2,
  });

  const currentMode = MODES.find((m) => m.id === mode);
  const accent = currentMode.accent;

  // ── Clock ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("en-GB"));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // ── Live node load simulation ─────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setGraph((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) => ({
          ...n,
          load: Math.min(100, Math.max(10, n.load + (Math.random() * 10 - 5))),
        })),
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // ── Energy: station load simulation ──────────────────────────────────────
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

  // ── Water: zone pressure simulation ──────────────────────────────────────
  useEffect(() => {
    if (mode !== "water") return;
    const iv = setInterval(() => {
      setZonePressures((z) => ({
        ...z,
        Z1: parseFloat((3.4 + Math.random() * 0.2).toFixed(2)),
        Z3: parseFloat((3.0 + Math.random() * 0.2).toFixed(2)),
      }));
    }, 5000);
    return () => clearInterval(iv);
  }, [mode]);

  // ── Auto alerts ───────────────────────────────────────────────────────────
  useEffect(() => {
    graph.nodes.forEach((n) => {
      if (n.load > 80) {
        setAlerts((prev) => {
          if (prev.find((a) => a.id === n.id && Date.now() - a.ts < 15000))
            return prev;
          return [
            { id: n.id, label: n.label, load: Math.round(n.load), mode,
              time: new Date().toLocaleTimeString(), ts: Date.now() },
            ...prev.slice(0, 49),
          ];
        });
      }
    });
  }, [graph]);

  // ─── Mode-aware Dijkstra ──────────────────────────────────────────────────
  const runRoute = useCallback(
    (srcId, dstId, currentGraph) => {
      const { sourceCanBeBlocked, destCanBeBlocked } = currentMode;
      const blockedNodes = currentGraph.nodes.filter((n) => n.isBlocked).map((n) => n.id);
      const srcBlocked = blockedNodes.includes(srcId);
      const dstBlocked = blockedNodes.includes(dstId);

      if (srcBlocked && !sourceCanBeBlocked)
        return { path: [], error: `[${currentMode.label}] Cannot route FROM a failed/flooded node.` };
      if (dstBlocked && !destCanBeBlocked)
        return { path: [], error: `[${currentMode.label}] Cannot route TO a flooded/blocked node.` };

      const result = dijkstra(currentGraph, srcId, dstId, blockedNodes);
      if (!result || result.length === 0) {
        const srcLabel = currentGraph.nodes.find((n) => n.id === srcId)?.label;
        const dstLabel = currentGraph.nodes.find((n) => n.id === dstId)?.label;
        return { path: [], error: `No route from ${srcLabel} to ${dstLabel}.` };
      }
      return { path: result, error: "" };
    },
    [currentMode]
  );

  const handleNodeClick = (nodeId) => {
    setPathError("");
    if (!start) { setStart(nodeId); setEnd(null); setPath([]); return; }
    if (nodeId === start) { setStart(null); setPath([]); return; }
    const { path: result, error } = runRoute(start, nodeId, graph);
    if (error) { setPathError(error); setPath([]); }
    else {
      setPath(result);
      setEnd(nodeId);
      setRouteHistory((prev) => [
        { from: graph.nodes.find((n) => n.id === start)?.label,
          to: graph.nodes.find((n) => n.id === nodeId)?.label,
          path: result, mode, time: new Date().toLocaleTimeString() },
        ...prev.slice(0, 19),
      ]);
    }
    setStart(null);
  };

  const runAutoRoute = () => {
    setPathError("");
    const active = graph.nodes.filter((n) => !n.isBlocked);
    if (active.length < 2) { setPathError("Not enough active nodes."); return; }
    const shuffled = [...active].sort(() => Math.random() - 0.5);
    const src = shuffled[0].id;
    const dst = shuffled[1].id;
    const { path: result, error } = runRoute(src, dst, graph);
    if (error) { setPathError(error); }
    else {
      setPath(result); setEnd(dst);
      setRouteHistory((prev) => [
        { from: graph.nodes.find((n) => n.id === src)?.label,
          to: graph.nodes.find((n) => n.id === dst)?.label,
          path: result, mode, time: new Date().toLocaleTimeString() },
        ...prev.slice(0, 19),
      ]);
    }
    setStart(null);
  };

  // ─── Disaster actions ─────────────────────────────────────────────────────
  const handleTriggerFlood = async () => {
    const allIds = graph.nodes.map((n) => n.id);
    const zones = [...allIds].sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 3) + 2);
    setFloodActive(true);
    setGraph((prev) => {
      const next = cloneGraph(prev);
      triggerFlood(next, zones, []);
      return next;
    });
    clearPath();
    setAlerts((prev) => [
      { id: "flood", label: `Flood — zones ${zones.join(", ")}`, load: 100,
        mode: "disaster", time: new Date().toLocaleTimeString(), ts: Date.now() },
      ...prev.slice(0, 49),
    ]);
    try {
      await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "disaster", zone: `Zones ${zones.join(", ")}`,
          severity: "critical", load: 100,
          description: `Flood triggered — zones ${zones.join(", ")} blocked` }),
      });
    } catch (err) { console.error(err); }
  };

  const handleResetFlood = async () => {
    setFloodActive(false);
    setGraph(cloneGraph(cityGraph));
    clearPath();
    try { await fetch("/api/incidents", { method: "DELETE" }); } catch (err) { console.error(err); }
  };

  // ─── Energy actions ───────────────────────────────────────────────────────
  const handleSimulateFailure = () => {
    setFailedStation("SA");
    setStationLoads((l) => ({ ...l, SD: 76, SE: 82, SF: 61 }));
    setGraph((prev) => {
      const next = cloneGraph(prev);
      // Mark the node whose id maps to "SA" as blocked
      const node = next.nodes.find((n) => n.id === "A");
      if (node) node.isBlocked = true;
      return next;
    });
    setAlerts((prev) => [
      { id: "SA", label: "MG Road Sub failure — load redistributed", load: 98,
        mode: "energy", time: new Date().toLocaleTimeString(), ts: Date.now() },
      ...prev.slice(0, 49),
    ]);
  };

  const handleResetEnergy = () => {
    setFailedStation(null);
    setStationLoads({ SA: 93, SB: 78, SC: 65, SD: 48, SE: 55, SF: 38, SG: 71 });
    setGraph(cloneGraph(cityGraph));
    clearPath();
  };

  // ─── Water actions ────────────────────────────────────────────────────────
  const handleSimulateBurst = () => {
    setBurstActive(true);
    setZonePressures((z) => ({ ...z, Z7: 0.6 }));
    setAlerts((prev) => [
      { id: "Z7", label: "ORR Zone pipe burst — pressure 0.6 bar", load: 95,
        mode: "water", time: new Date().toLocaleTimeString(), ts: Date.now() },
      ...prev.slice(0, 49),
    ]);
  };

  const handleResetWater = () => {
    setBurstActive(false);
    setZonePressures({ Z1: 3.4, Z3: 3.0, Z7: 1.4, Z8: 3.2 });
  };

  const clearPath = () => { setPath([]); setStart(null); setEnd(null); setPathError(""); };

  // ─── AI Advisor ───────────────────────────────────────────────────────────
  const getAIAdvice = async () => {
    setAiLoading(true); setAdvice("");
    try {
      const critical = graph.nodes.find((n) => n.load > 80) || graph.nodes[0];
      const res = await fetch("/api/ai-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, zone: critical.label, load: Math.round(critical.load) }),
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setAdvice((prev) => prev + decoder.decode(value));
      }
    } catch { setAdvice("Failed to fetch advice."); }
    finally { setAiLoading(false); }
  };

  // ─── Derived stats ────────────────────────────────────────────────────────
  const avgLoad = Math.round(graph.nodes.reduce((a, n) => a + n.load, 0) / graph.nodes.length);
  const criticalCount = graph.nodes.filter((n) => n.load > 80).length;
  const blockedCount = graph.nodes.filter((n) => n.isBlocked).length;
  const activeEdges = graph.edges.filter((e) => !e.isBlocked).length;
  const avgStationLoad = Math.round(Object.values(stationLoads).reduce((a, b) => a + b, 0) / Object.keys(stationLoads).length);
  const z7Pressure = zonePressures.Z7 ?? 1.4;

  // ─── Mode-specific stats row config ──────────────────────────────────────
  const STATS = {
    traffic: [
      { label: "VEHICLES",     value: (2800 + Math.round(avgLoad * 3)).toLocaleString(), icon: Navigation, badge: "LIVE",     badgeColor: "#22c55e" },
      { label: "AVG SPEED",    value: `${Math.max(15, 60 - Math.round(avgLoad * 0.4))} km/h`, icon: Activity, badge: avgLoad > 70 ? "SLOW" : "OK", badgeColor: avgLoad > 70 ? "#f59e0b" : "#22c55e" },
      { label: "CONGESTION",   value: `${avgLoad}%`, icon: BarChart3, badge: criticalCount > 0 ? "CRITICAL" : "NORMAL", badgeColor: criticalCount > 0 ? "#ef4444" : "#22c55e" },
      { label: "ACTIVE ROUTES",value: activeEdges, icon: GitBranch, badge: "DIJKSTRA", badgeColor: accent },
    ],
    energy: [
      { label: "TOTAL LOAD",      value: `${avgStationLoad}%`, icon: Zap,       badge: "PEAK HRS", badgeColor: "#f59e0b" },
      { label: "ACTIVE STATIONS", value: failedStation ? "6/7" : "7/7", icon: Building2, badge: failedStation ? "1 FAILED" : "ALL ON", badgeColor: failedStation ? "#ef4444" : "#22c55e" },
      { label: "GRID FLOW",       value: "2.4 GW", icon: Activity,  badge: "MAX FLOW", badgeColor: "#f59e0b" },
      { label: "EFFICIENCY",      value: "91%",    icon: BarChart3, badge: "+2%",      badgeColor: "#22c55e" },
    ],
    water: [
      { label: "SYSTEM PRESSURE", value: "3.2 bar",              icon: Gauge,   badge: "NORMAL",  badgeColor: "#38bdf8" },
      { label: "ORR ZONE",        value: `${z7Pressure.toFixed(1)} bar`, icon: Waves,   badge: burstActive ? "BURST" : "OK", badgeColor: burstActive ? "#ef4444" : "#38bdf8" },
      { label: "ACTIVE PIPES",    value: burstActive ? "24/26" : "26/26", icon: GitBranch, badge: burstActive ? "1 BURST" : "ALL CLEAR", badgeColor: burstActive ? "#ef4444" : "#22c55e" },
      { label: "MST COVERAGE",    value: "100%",                 icon: Shield,  badge: "PRIM'S",  badgeColor: "#38bdf8" },
    ],
    disaster: [
      { label: "FLOOD LEVEL",  value: floodActive ? "Severe"  : "Standby", icon: Waves,    badge: floodActive ? `${blockedCount} ZONES` : "MONITORING", badgeColor: floodActive ? "#ef4444" : "#22c55e" },
      { label: "SHELTERS",     value: "12/18",   icon: Building2, badge: "AVAILABLE",  badgeColor: "#22c55e" },
      { label: "BMTC BUSES",   value: "47",      icon: Bus,       badge: "DEPLOYED",   badgeColor: "#f59e0b" },
      { label: "EVACUATION",   value: floodActive ? "Active" : "Standby", icon: Navigation, badge: floodActive ? "REROUTED" : "READY", badgeColor: floodActive ? "#ef4444" : "#22c55e" },
    ],
  };

  // ─── Mode-specific live metrics ───────────────────────────────────────────
  const renderMetrics = () => {
    if (mode === "energy") {
      return Object.entries(stationLoads).map(([k, v]) => (
        <div key={k} className="flex items-center gap-2">
          <span className="text-xs truncate" style={{ color: sub, width: 80, flexShrink: 0 }}>
            Station {k.slice(1)}
          </span>
          <div style={{ flex: 1, height: 4, background: bdr, borderRadius: 9 }}>
            <motion.div animate={{ width: `${v}%` }} transition={{ duration: 0.8 }}
                        style={{ height: 4, borderRadius: 9,
                                 background: v > 80 ? "#ef4444" : v > 65 ? "#f59e0b" : "#22c55e" }} />
          </div>
          <span className="text-xs font-mono w-8 text-right flex-shrink-0"
                style={{ color: v > 80 ? "#ef4444" : v > 65 ? "#f59e0b" : "#22c55e" }}>
            {v}%
          </span>
        </div>
      ));
    }

    if (mode === "water") {
      const waterMetrics = [
        { name: "Zone 1", pct: Math.round(((zonePressures.Z1 ?? 3.4) / 4) * 100), label: `${(zonePressures.Z1 ?? 3.4).toFixed(1)}b` },
        { name: "Zone 3", pct: Math.round(((zonePressures.Z3 ?? 3.0) / 4) * 100), label: `${(zonePressures.Z3 ?? 3.0).toFixed(1)}b` },
        { name: "Zone 5", pct: Math.round((2.8 / 4) * 100),  label: "2.8b" },
        { name: "Zone 7", pct: Math.round((z7Pressure / 4) * 100), label: `${z7Pressure.toFixed(1)}b`, alert: burstActive },
        { name: "Zone 9", pct: Math.round((2.6 / 4) * 100),  label: "2.6b" },
      ];
      return waterMetrics.map((m) => (
        <div key={m.name} className="flex items-center gap-2">
          <span className="text-xs truncate" style={{ color: sub, width: 80, flexShrink: 0 }}>{m.name}</span>
          <div style={{ flex: 1, height: 4, background: bdr, borderRadius: 9 }}>
            <motion.div animate={{ width: `${m.pct}%` }} transition={{ duration: 0.8 }}
                        style={{ height: 4, borderRadius: 9,
                                 background: m.alert ? "#ef4444" : "#38bdf8" }} />
          </div>
          <span className="text-xs font-mono w-8 text-right flex-shrink-0"
                style={{ color: m.alert ? "#ef4444" : "#38bdf8" }}>
            {m.label}
          </span>
        </div>
      ));
    }

    if (mode === "disaster") {
      const resources = [
        { name: "Shelters",   pct: 67, label: "12/18", color: "#22c55e" },
        { name: "BMTC Buses", pct: 78, label: "47/60", color: "#f59e0b" },
        { name: "Personnel",  pct: 82, label: "246",   color: "#38bdf8" },
        { name: "Hospitals",  pct: 50, label: "3/6",   color: "#ef4444" },
      ];
      return resources.map((r) => (
        <div key={r.name} className="flex items-center gap-2">
          <span className="text-xs truncate" style={{ color: sub, width: 80, flexShrink: 0 }}>{r.name}</span>
          <div style={{ flex: 1, height: 4, background: bdr, borderRadius: 9 }}>
            <motion.div animate={{ width: `${r.pct}%` }} transition={{ duration: 0.8 }}
                        style={{ height: 4, borderRadius: 9, background: r.color }} />
          </div>
          <span className="text-xs font-mono w-8 text-right flex-shrink-0" style={{ color: r.color }}>
            {r.label}
          </span>
        </div>
      ));
    }

    // Default: traffic — first 6 nodes
    return graph.nodes.slice(0, 6).map((node) => (
      <div key={node.id} className="flex items-center gap-2">
        <span className="text-xs truncate" style={{ color: sub, width: 80, flexShrink: 0 }}>
          {node.label.split(" ")[0]}
        </span>
        <div style={{ flex: 1, height: 4, background: bdr, borderRadius: 9 }}>
          <motion.div
            animate={{ width: node.isBlocked ? "100%" : `${node.load}%` }}
            transition={{ duration: 0.8 }}
            style={{ height: 4, borderRadius: 9,
                     background: node.isBlocked ? "#3b82f6" : node.load > 80 ? "#ef4444" : node.load > 60 ? "#f97316" : "#22c55e" }}
          />
        </div>
        <span className="text-xs font-mono w-8 text-right flex-shrink-0"
              style={{ color: node.isBlocked ? "#3b82f6" : node.load > 80 ? "#ef4444" : node.load > 60 ? "#f97316" : "#22c55e" }}>
          {node.isBlocked ? "⛔" : `${Math.round(node.load)}%`}
        </span>
      </div>
    ));
  };

  // ─── Mode-specific action buttons ─────────────────────────────────────────
  const renderActionButtons = () => {
    if (mode === "disaster") return (
      <button
        onClick={floodActive ? handleResetFlood : handleTriggerFlood}
        style={{
          background: floodActive ? "rgba(59,130,246,0.10)" : "rgba(239,68,68,0.10)",
          border: `1px solid ${floodActive ? "rgba(59,130,246,0.30)" : "rgba(239,68,68,0.30)"}`,
          color: floodActive ? "#60a5fa" : "#ef4444",
          padding: "6px 12px", borderRadius: 7, fontSize: 12, fontWeight: 700,
        }}
        className={!floodActive ? "animate-pulse" : ""}>
        {floodActive ? "↺ RESET CITY" : "⚡ TRIGGER FLOOD"}
      </button>
    );

    if (mode === "energy") return (
      <button
        onClick={failedStation ? handleResetEnergy : handleSimulateFailure}
        style={{
          background: failedStation ? "rgba(59,130,246,0.10)" : "rgba(245,158,11,0.10)",
          border: `1px solid ${failedStation ? "rgba(59,130,246,0.30)" : "rgba(245,158,11,0.30)"}`,
          color: failedStation ? "#60a5fa" : "#f59e0b",
          padding: "6px 12px", borderRadius: 7, fontSize: 12, fontWeight: 700,
        }}>
        {failedStation ? "↺ RESTORE GRID" : "⚡ SIMULATE FAILURE"}
      </button>
    );

    if (mode === "water") return (
      <button
        onClick={burstActive ? handleResetWater : handleSimulateBurst}
        style={{
          background: burstActive ? "rgba(59,130,246,0.10)" : "rgba(56,189,248,0.10)",
          border: `1px solid ${burstActive ? "rgba(59,130,246,0.30)" : "rgba(56,189,248,0.30)"}`,
          color: burstActive ? "#60a5fa" : "#38bdf8",
          padding: "6px 12px", borderRadius: 7, fontSize: 12, fontWeight: 700,
        }}>
        {burstActive ? "↺ RESTORE PIPES" : "💧 SIMULATE BURST"}
      </button>
    );

    return null;
  };

  // ─── Mode-specific alert banners ──────────────────────────────────────────
  const renderAlertBanner = () => {
    if (mode === "disaster" && floodActive) return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.30)",
                           borderRadius: 10, padding: "12px 16px" }}
                  className="flex-shrink-0">
        <p className="text-xs font-bold" style={{ color: "#ef4444" }}>
          🚨 CRITICAL — Flood active · {blockedCount} zones blocked · Evacuation routes computed via Dijkstra
        </p>
        <p className="text-xs mt-1" style={{ color: sub }}>
          Route via safe corridors · 12 shelters open · Avoid flooded zones as destination
        </p>
      </motion.div>
    );

    if (mode === "energy" && failedStation) return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.30)",
                           borderRadius: 10, padding: "12px 16px" }}
                  className="flex-shrink-0">
        <p className="text-xs font-bold" style={{ color: "#f59e0b" }}>
          ⚡ CRITICAL — MG Road substation failed · Load redistributed to E-City, Whitefield, Silk Board
        </p>
        <p className="text-xs mt-1" style={{ color: sub }}>
          Failed node can be destination (rerouting power TO it) · Cannot be source
        </p>
      </motion.div>
    );

    if (mode === "energy") return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.20)",
                           borderRadius: 10, padding: "12px 16px" }}
                  className="flex-shrink-0">
        <p className="text-xs font-bold" style={{ color: "#f59e0b" }}>
          ⚠ WARNING — MG Road sub approaching critical ({stationLoads.SA}%) · Peak window 18:00–21:00
        </p>
        <p className="text-xs mt-1" style={{ color: sub }}>Max flow algorithm active</p>
      </motion.div>
    );

    if (mode === "water" && burstActive) return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.30)",
                           borderRadius: 10, padding: "12px 16px" }}
                  className="flex-shrink-0">
        <p className="text-xs font-bold" style={{ color: "#ef4444" }}>
          🚨 CRITICAL — Pipe burst in ORR Zone · Pressure drop to {z7Pressure.toFixed(1)} bar (−58%)
        </p>
        <p className="text-xs mt-1" style={{ color: sub }}>
          Pipe age: 23yr · Rainfall: high · BWSSB crew ETA 28 min
        </p>
      </motion.div>
    );

    return null;
  };

  // ─── Theme tokens ─────────────────────────────────────────────────────────
  const bg      = dark ? "#0a0c12" : "#f4f4f0";
  const card    = dark ? "#10121a" : "#ffffff";
  const side    = dark ? "#0d0f18" : "#ebebе6";
  const txt     = dark ? "#e8e8e0" : "#111118";
  const sub     = dark ? "#5a5c6a" : "#888898";
  const bdr     = dark ? "#1e2030" : "#e0e0d8";
  const inputBg = dark ? "#181a26" : "#f0f0ea";

  // ─── Side panel ───────────────────────────────────────────────────────────
  const PANELS = [
    { id: "incident",  label: "Incident Log",  icon: FileText  },
    { id: "history",   label: "Route History", icon: History   },
    { id: "citygraph", label: "City Graph",    icon: GitBranch },
  ];

  const renderSidePanel = () => {
    if (!sidePanel) return null;
    const panelLabel = PANELS.find((p) => p.id === sidePanel)?.label;
    return (
      <AnimatePresence>
        <motion.div key={sidePanel}
                    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}
                    style={{ background: side, borderRight: `1px solid ${bdr}`, color: txt }}
                    className="w-72 flex flex-col overflow-hidden flex-shrink-0">
          <div style={{ borderBottom: `1px solid ${bdr}` }}
               className="flex items-center justify-between px-4 py-3">
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: sub }}>
              {panelLabel}
            </span>
            <button onClick={() => setSidePanel(null)} style={{ color: sub }}
                    className="transition-opacity hover:opacity-60">
              <X size={13} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
            {sidePanel === "incident" && (
              alerts.length === 0
                ? <p className="text-xs" style={{ color: sub }}>No incidents recorded.</p>
                : alerts.map((a, i) => (
                  <div key={a.ts + i}
                       style={{ background: a.load > 90 ? "rgba(239,68,68,0.08)" : "rgba(245,158,11,0.08)",
                                border: `1px solid ${a.load > 90 ? "rgba(239,68,68,0.25)" : "rgba(245,158,11,0.20)"}`,
                                borderRadius: 8 }}
                       className="px-3 py-2.5">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-xs font-semibold"
                            style={{ color: a.load > 90 ? "#ef4444" : "#f59e0b" }}>{a.label}</span>
                      <span className="text-xs" style={{ color: sub }}>{a.time}</span>
                    </div>
                    <div className="flex gap-2 text-xs" style={{ color: sub }}>
                      <span>Load: <span style={{ color: txt }}>{a.load}%</span></span>
                      <span style={{ padding: "1px 6px", borderRadius: 4, fontSize: 10,
                                     background: MODES.find(m => m.id === a.mode)?.accentBg,
                                     color: MODES.find(m => m.id === a.mode)?.accent }}>{a.mode}</span>
                    </div>
                  </div>
                ))
            )}

            {sidePanel === "history" && (
              routeHistory.length === 0
                ? <p className="text-xs" style={{ color: sub }}>No routes computed yet.</p>
                : routeHistory.map((r, i) => (
                  <div key={i} style={{ background: card, border: `1px solid ${bdr}`, borderRadius: 8 }}
                       className="p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold" style={{ color: txt }}>{r.from} → {r.to}</span>
                      <span className="text-xs" style={{ color: sub }}>{r.time}</span>
                    </div>
                    <div className="flex items-center flex-wrap gap-1 mt-1.5">
                      {r.path.map((id, j) => (
                        <span key={id} className="flex items-center gap-1">
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded"
                                style={{ background: inputBg, color: txt }}>{id}</span>
                          {j < r.path.length - 1 && <ChevronRight size={9} style={{ color: sub }} />}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs" style={{ color: sub }}>{r.path.length - 1} hops</span>
                      <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4,
                                     background: MODES.find(m => m.id === r.mode)?.accentBg,
                                     color: MODES.find(m => m.id === r.mode)?.accent }}>{r.mode}</span>
                    </div>
                  </div>
                ))
            )}

            {sidePanel === "citygraph" && (
              <>
                <div style={{ background: card, border: `1px solid ${bdr}`, borderRadius: 8 }} className="p-3 mb-1">
                  <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: sub }}>Summary</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Nodes",        value: graph.nodes.length },
                      { label: "Edges",         value: graph.edges.length },
                      { label: "Active Edges",  value: activeEdges },
                      { label: "Blocked Nodes", value: blockedCount },
                    ].map((s) => (
                      <div key={s.label} style={{ background: inputBg, borderRadius: 6 }} className="px-2 py-2">
                        <p className="text-xs mb-0.5" style={{ color: sub }}>{s.label}</p>
                        <p className="text-xl font-black" style={{ color: txt }}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ background: card, border: `1px solid ${bdr}`, borderRadius: 8 }} className="p-3 mb-1">
                  <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: sub }}>Nodes</p>
                  <div className="flex flex-col gap-1.5">
                    {graph.nodes.map((n) => (
                      <div key={n.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                style={{ background: n.isBlocked ? "#374151" : n.load > 80 ? "#ef4444" : n.load > 60 ? "#f97316" : "#22c55e" }}>
                            {n.id}
                          </span>
                          <span style={{ color: n.isBlocked ? sub : txt }} className="truncate max-w-[120px]">
                            {n.label}
                          </span>
                        </div>
                        <span className="font-mono"
                              style={{ color: n.isBlocked ? sub : n.load > 80 ? "#ef4444" : n.load > 60 ? "#f97316" : "#22c55e" }}>
                          {n.isBlocked ? "⛔" : `${Math.round(n.load)}%`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ background: card, border: `1px solid ${bdr}`, borderRadius: 8 }} className="p-3">
                  <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: sub }}>Edges</p>
                  <div className="flex flex-col gap-1">
                    {graph.edges.map((e, i) => (
                      <div key={i} className="flex items-center justify-between text-xs"
                           style={{ opacity: e.isBlocked ? 0.4 : 1 }}>
                        <span style={{ color: sub }}>{e.from} → {e.to}</span>
                        <span className="font-mono" style={{ color: e.isBlocked ? "#ef4444" : txt }}>
                          {e.isBlocked ? "blocked" : `w:${e.weight ?? "—"}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ background: bg, color: txt, minHeight: "100vh",
                  fontFamily: "'IBM Plex Mono', 'Fira Code', monospace" }}
         className="flex flex-col">

      {/* ── Top bar ───────────────────────────────────────────────────── */}
      <header style={{ background: card, borderBottom: `1px solid ${bdr}` }}
              className="flex items-center justify-between px-5 py-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div style={{ background: accent, width: 8, height: 8, borderRadius: "50%" }}
                 className="animate-pulse" />
            <span className="font-black text-base tracking-tight" style={{ color: txt }}>URBANTWINS</span>
            <span className="text-xs" style={{ color: sub }}>OPS</span>
          </div>
          <div style={{ background: currentMode.accentBg, border: `1px solid ${currentMode.accentBorder}`,
                        color: accent, padding: "2px 10px", borderRadius: 999,
                        fontSize: 11, fontWeight: 700, letterSpacing: "0.08em" }}>
            {currentMode.label.toUpperCase()} MODE
          </div>
        </div>

        <div className="flex items-center gap-2">
          {[
            { label: "GRID",  ok: !failedStation },
            { label: "WATER", ok: !burstActive },
            { label: "FLOOD", ok: !floodActive },
          ].map((s) => (
            <div key={s.label}
                 style={{ background: s.ok ? inputBg : "rgba(239,68,68,0.08)",
                           border: `1px solid ${s.ok ? bdr : "rgba(239,68,68,0.30)"}`,
                           color: s.ok ? sub : "#ef4444",
                           padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
              {s.label}&nbsp;
              <span style={{ color: s.ok ? (dark ? "#22c55e" : "#16a34a") : "#ef4444" }}>●</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-mono" style={{ color: sub }}>{time}</span>
          <button onClick={() => setDark(!dark)}
                  style={{ border: `1px solid ${bdr}`, background: inputBg, color: sub,
                            padding: "5px 12px", borderRadius: 6, fontSize: 12 }}
                  className="flex items-center gap-1.5 transition-opacity hover:opacity-70">
            {dark ? <Sun size={12} /> : <Moon size={12} />}
            {dark ? "LIGHT" : "DARK"}
          </button>
          <UserButton />
        </div>
      </header>

      {/* ── Body ──────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Primary sidebar ─────────────────────────────────────────── */}
        <nav style={{ background: side, borderRight: `1px solid ${bdr}`, width: 200 }}
             className="flex flex-col p-4 gap-6 flex-shrink-0 overflow-y-auto">

          <div>
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: sub }}>Systems</p>
            <div className="flex flex-col gap-1">
              {MODES.map((m) => {
                const Icon = m.icon;
                const active = mode === m.id;
                return (
                  <button key={m.id} onClick={() => { setMode(m.id); clearPath(); }}
                          style={{ background: active ? m.accentBg : "transparent",
                                   border: `1px solid ${active ? m.accentBorder : "transparent"}`,
                                   color: active ? m.accent : sub, borderRadius: 7,
                                   padding: "8px 12px", textAlign: "left",
                                   fontSize: 13, fontWeight: active ? 700 : 400, transition: "all 0.15s" }}
                          className="flex items-center gap-2 w-full">
                    <Icon size={14} />
                    {m.label}
                    {active && (
                      <span style={{ marginLeft: "auto", fontSize: 9, background: m.accentBg,
                                     color: m.accent, padding: "1px 5px", borderRadius: 3,
                                     border: `1px solid ${m.accentBorder}` }}>LIVE</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Route rules */}
          <div style={{ background: card, border: `1px solid ${bdr}`, borderRadius: 8 }} className="p-3">
            <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: sub }}>Route Rules</p>
            <div className="flex flex-col gap-1.5 text-xs" style={{ color: sub }}>
              {[
                { label: "Blocked as source", ok: currentMode.sourceCanBeBlocked },
                { label: "Blocked as dest",   ok: currentMode.destCanBeBlocked },
                { label: "Pass-through",       ok: false },
              ].map((r) => (
                <div key={r.label} className="flex items-center gap-2">
                  <span style={{ color: r.ok ? "#22c55e" : "#ef4444" }}>{r.ok ? "✓" : "✗"}</span>
                  <span>{r.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tools */}
          <div>
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: sub }}>Tools</p>
            <div className="flex flex-col gap-1">
              {PANELS.map((p) => {
                const Icon = p.icon;
                const open = sidePanel === p.id;
                return (
                  <button key={p.id} onClick={() => setSidePanel(open ? null : p.id)}
                          style={{ background: open ? `${accent}15` : "transparent",
                                   border: `1px solid ${open ? `${accent}30` : "transparent"}`,
                                   color: open ? accent : sub, borderRadius: 7,
                                   padding: "8px 12px", textAlign: "left",
                                   fontSize: 13, fontWeight: open ? 600 : 400 }}
                          className="flex items-center gap-2 w-full">
                    <Icon size={13} />
                    {p.label}
                    {p.id === "incident" && alerts.length > 0 && (
                      <span style={{ marginLeft: "auto", background: "#ef4444", color: "#fff",
                                     fontSize: 10, padding: "0 5px", borderRadius: 999, fontWeight: 700 }}>
                        {alerts.length > 9 ? "9+" : alerts.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Health bars */}
          <div>
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: sub }}>Health</p>
            <div className="flex flex-col gap-2.5">
              {[
                { label: "Traffic", val: avgLoad,                               accent: "#22c55e" },
                { label: "Energy",  val: failedStation ? 35 : avgStationLoad,   accent: "#f59e0b" },
                { label: "Water",   val: burstActive   ? 40 : 80,               accent: "#38bdf8" },
                { label: "Disaster",val: floodActive   ? 25 : 85,               accent: "#ef4444" },
              ].map((h) => (
                <div key={h.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: sub }}>{h.label}</span>
                    <span style={{ color: txt }}>{h.val}%</span>
                  </div>
                  <div style={{ height: 3, background: bdr, borderRadius: 9 }}>
                    <div style={{ height: 3, borderRadius: 9, width: `${h.val}%`,
                                  background: h.val > 80 ? "#ef4444" : h.val > 60 ? "#f59e0b" : h.accent,
                                  transition: "width 0.8s" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </nav>

        {renderSidePanel()}

        {/* ── Main content ──────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden p-4 gap-4">

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3 flex-shrink-0">
            {STATS[mode].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label}
                     style={{ background: card, border: `1px solid ${bdr}`, borderRadius: 10 }}
                     className="p-4 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold tracking-widest" style={{ color: sub }}>{stat.label}</p>
                    <Icon size={13} style={{ color: sub }} />
                  </div>
                  <p className="text-3xl font-black leading-none mb-2" style={{ color: txt }}>{stat.value}</p>
                  <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, fontWeight: 700,
                                  background: `${stat.badgeColor}18`, color: stat.badgeColor,
                                  border: `1px solid ${stat.badgeColor}30`, alignSelf: "flex-start",
                                  letterSpacing: "0.07em" }}>
                    {stat.badge}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Map + right panel */}
          <div className="flex gap-4 flex-1 overflow-hidden min-h-0">

            {/* Map card */}
            <div style={{ background: card, border: `1px solid ${bdr}`, borderRadius: 10 }}
                 className="flex-1 flex flex-col overflow-hidden">
              <div style={{ borderBottom: `1px solid ${bdr}` }}
                   className="flex items-center justify-between px-4 py-3 flex-shrink-0">
                <div>
                  <p className="font-bold text-sm" style={{ color: txt }}>
                    City Road Network
                    <span className="ml-2 text-xs font-normal" style={{ color: sub }}>{currentMode.label} Mode</span>
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: sub }}>
                    {start
                      ? `Origin: ${graph.nodes.find((n) => n.id === start)?.label} — select destination`
                      : "Click two nodes to route · Auto-Route for random path"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {renderActionButtons()}
                  {path.length > 0 && (
                    <button onClick={clearPath}
                            style={{ background: inputBg, border: `1px solid ${bdr}`,
                                      color: sub, padding: "6px 12px", borderRadius: 7, fontSize: 12 }}>
                      CLEAR PATH
                    </button>
                  )}
                  <button onClick={runAutoRoute}
                          style={{ background: `${accent}18`, border: `1px solid ${accent}40`,
                                    color: accent, padding: "6px 14px", borderRadius: 7,
                                    fontSize: 12, fontWeight: 700 }}>
                    AUTO-ROUTE
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0">
                <MapView nodes={graph.nodes} edges={graph.edges} path={path} onNodeClick={handleNodeClick} />
              </div>

              <AnimatePresence>
                {pathError && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                              style={{ borderTop: "1px solid rgba(239,68,68,0.25)",
                                       background: "rgba(239,68,68,0.08)",
                                       color: "#ef4444", padding: "8px 16px", fontSize: 12 }}
                              className="flex items-center gap-2 flex-shrink-0">
                    <AlertCircle size={13} />
                    {pathError}
                    <button onClick={() => setPathError("")} className="ml-auto opacity-60 hover:opacity-100">
                      <X size={11} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {path.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                              style={{ borderTop: `1px solid ${bdr}`, padding: "10px 16px", fontSize: 12 }}
                              className="flex items-center gap-2 flex-shrink-0">
                    <MapPin size={12} style={{ color: accent, flexShrink: 0 }} />
                    <span style={{ color: sub }}>Optimal:</span>
                    <span className="font-bold" style={{ color: accent }}>
                      {path.map((id) => graph.nodes.find((n) => n.id === id)?.label?.split(" ")[0]).join(" → ")}
                    </span>
                    <span style={{ color: sub, marginLeft: 8 }}>{path.length - 1} hops · Dijkstra optimal</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ borderTop: `1px solid ${bdr}`, padding: "7px 16px" }}
                   className="flex items-center gap-5 flex-shrink-0">
                {[
                  { color: "#22c55e", label: "Clear" },
                  { color: "#f97316", label: "Moderate" },
                  { color: "#ef4444", label: "Congested" },
                  { color: "#facc15", label: "Path" },
                  { color: "#3b82f6", label: "Blocked" },
                ].map((l) => (
                  <span key={l.label} className="flex items-center gap-1.5" style={{ fontSize: 11, color: sub }}>
                    <span style={{ width: 18, height: 3, background: l.color, display: "inline-block", borderRadius: 2 }} />
                    {l.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Right panel */}
            <div className="w-72 flex flex-col gap-3 overflow-y-auto flex-shrink-0">

              {/* Live metrics */}
              <div style={{ background: card, border: `1px solid ${bdr}`, borderRadius: 10 }}
                   className="p-4 flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold" style={{ color: txt }}>
                    {mode === "energy" ? "Station Load" : mode === "water" ? "Zone Pressure" : mode === "disaster" ? "Resources" : "Live Metrics"}
                  </p>
                  <Radio size={13} style={{ color: accent }} className="animate-pulse" />
                </div>
                <div className="flex flex-col gap-3">
                  {renderMetrics()}
                </div>
              </div>

              {/* AI Advisor */}
              <div style={{ background: card, border: `1px solid ${bdr}`, borderRadius: 10 }}
                   className="p-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Cpu size={13} style={{ color: accent }} />
                    <p className="text-sm font-bold" style={{ color: txt }}>AI Advisor</p>
                  </div>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={getAIAdvice} disabled={aiLoading}
                                 style={{ background: inputBg, border: `1px solid ${bdr}`, color: sub,
                                           padding: "4px 10px", borderRadius: 6, fontSize: 11 }}
                                 className="flex items-center gap-1 disabled:opacity-40">
                    <RefreshCw size={10} className={aiLoading ? "animate-spin" : ""} />
                    {aiLoading ? "ANALYZING" : "REFRESH"}
                  </motion.button>
                </div>
                <p className="text-xs mb-3" style={{ color: sub }}>AI-powered recommendations</p>
                {advice || aiLoading ? (
                  <div style={{ background: inputBg, borderRadius: 8 }} className="p-3 flex-1">
                    <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: sub }}>
                      {mode.toUpperCase()} ANALYSIS
                    </p>
                    {aiLoading && !advice
                      ? <p className="text-xs animate-pulse" style={{ color: sub }}>Analyzing city infrastructure...</p>
                      : <div className="flex flex-col gap-2">
                          {advice.split("\n").filter((l) => l.trim()).slice(0, 4).map((line, i) => (
                            <div key={i} className="flex gap-2 text-xs">
                              <span className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5"
                                    style={{ background: `${accent}20`, color: accent }}>{i + 1}</span>
                              <span style={{ color: txt, lineHeight: 1.5 }}>
                                {line.replace(/^\d+\.\s*/, "").replace(/^\*+\s*/, "")}
                              </span>
                            </div>
                          ))}
                        </div>
                    }
                  </div>
                ) : (
                  <p className="text-xs" style={{ color: sub }}>Click REFRESH for real-time recommendations.</p>
                )}
              </div>

              {/* Alert log */}
              <div style={{ background: card, border: `1px solid ${bdr}`, borderRadius: 10 }}
                   className="p-4 flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Shield size={13} style={{ color: criticalCount > 0 ? "#ef4444" : sub }} />
                    <p className="text-sm font-bold" style={{ color: txt }}>Alert Log</p>
                  </div>
                  <span className="text-xs" style={{ color: sub }}>{alerts.length} events</span>
                </div>
                <div className="flex flex-col gap-2 max-h-36 overflow-y-auto">
                  <AnimatePresence>
                    {alerts.length === 0
                      ? <p className="text-xs" style={{ color: sub }}>No alerts yet.</p>
                      : alerts.map((a) => (
                        <motion.div key={a.id + a.ts}
                                    initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                                    style={{ background: inputBg, borderRadius: 6, padding: "6px 10px" }}
                                    className="flex justify-between text-xs">
                          <span style={{ color: a.load > 90 ? "#ef4444" : "#f59e0b" }}>{a.label}</span>
                          <span style={{ color: sub }}>{a.time}</span>
                        </motion.div>
                      ))
                    }
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          {/* ── Mode-specific alert banner ─────────────────────────────── */}
          {renderAlertBanner()}
        </main>
      </div>
    </div>
  );
}