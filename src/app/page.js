"use client";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { cityGraph } from "@/data/cityGraph";
import { dijkstra } from "@/modes/traffic";
import { UserButton } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Zap,
  Droplets,
  AlertTriangle,
  FileText,
  History,
  GitBranch,
  Moon,
  Sun,
  RefreshCw,
  X,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

const MODES = [
  { id: "traffic", label: "Traffic", icon: Activity },
  { id: "energy", label: "Energy", icon: Zap },
  { id: "water", label: "Water", icon: Droplets },
  { id: "disaster", label: "Disaster", icon: AlertTriangle },
];

export default function Home() {
  const [mode, setMode] = useState("traffic");
  const [graph, setGraph] = useState(cityGraph);
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [path, setPath] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [advice, setAdvice] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [floodActive, setFloodActive] = useState(false);
  const [dark, setDark] = useState(true);
  const [time, setTime] = useState("");
  const [sidePanel, setSidePanel] = useState(null);
  const [pathError, setPathError] = useState("");
  const [systemHealth] = useState({
    traffic: 78,
    energy: 62,
    water: 91,
    disaster: 55,
  });

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("en-GB"));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // Live simulation
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

  // Auto alerts
  useEffect(() => {
    graph.nodes.forEach((n) => {
      if (n.load > 80) {
        setAlerts((prev) => {
          if (prev.find((a) => a.id === n.id && Date.now() - a.ts < 15000))
            return prev;
          return [
            {
              id: n.id,
              label: n.label,
              load: Math.round(n.load),
              mode,
              time: new Date().toLocaleTimeString(),
              ts: Date.now(),
            },
            ...prev.slice(0, 49),
          ];
        });
      }
    });
  }, [graph]);

  // Fixed Dijkstra node-click logic
  const handleNodeClick = (nodeId) => {
    setPathError("");
    if (!start) {
      setStart(nodeId);
      setEnd(null);
      setPath([]);
    } else if (nodeId === start) {
      setStart(null);
      setPath([]);
    } else {
      const blocked = graph.nodes.filter((n) => n.isBlocked).map((n) => n.id);
      const result = dijkstra(graph, start, nodeId, blocked);
      if (!result || result.length === 0) {
        setPathError(
          `No route from ${graph.nodes.find((n) => n.id === start)?.label} to ${graph.nodes.find((n) => n.id === nodeId)?.label}`,
        );
        setPath([]);
      } else {
        setPath(result);
        setEnd(nodeId);
      }
      setStart(null);
    }
  };

  // Auto-Route button: pick random valid start/end
  const runDijkstra = () => {
    setPathError("");
    const activeNodes = graph.nodes.filter((n) => !n.isBlocked);
    if (activeNodes.length < 2) {
      setPathError("Not enough active nodes to compute a path.");
      return;
    }
    const shuffled = [...activeNodes].sort(() => Math.random() - 0.5);
    const src = shuffled[0].id;
    const dst = shuffled[1].id;
    const blocked = graph.nodes.filter((n) => n.isBlocked).map((n) => n.id);
    const result = dijkstra(graph, src, dst, blocked);
    if (!result || result.length === 0) {
      setPathError("Could not find a valid route. Try again.");
    } else {
      setPath(result);
      setStart(null);
      setEnd(dst);
    }
  };

  const triggerFlood = async () => {
    // Pick 2–4 random zones from all node IDs
    const allZones = graph.nodes.map((n) => n.id);
    const shuffled = [...allZones].sort(() => Math.random() - 0.5);
    const count = Math.floor(Math.random() * 3) + 2; // 2, 3, or 4 zones
    const zones = shuffled.slice(0, count);

    setFloodActive(true);
    setGraph((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        zones.includes(n.id) ? { ...n, isBlocked: true } : n,
      ),
      edges: prev.edges.map((e) =>
        zones.includes(e.from) || zones.includes(e.to)
          ? { ...e, isBlocked: true }
          : e,
      ),
    }));

    // Save flood incident to MongoDB
    try {
      await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "disaster",
          zone: `Zones ${zones.join(", ")}`,
          severity: "critical",
          load: 100,
          description: `Flood triggered — zones ${zones.join(", ")} blocked`,
        }),
      });
    } catch (err) {
      console.error("Failed to log flood incident:", err);
    }
  };

  const resetFlood = async () => {
    setFloodActive(false);
    setGraph(cityGraph);
    setPath([]);
    setStart(null);
    setEnd(null);
    setPathError("");

    // Clear all incidents from MongoDB
    try {
      await fetch("/api/incidents", { method: "DELETE" });
    } catch (err) {
      console.error("Failed to clear incidents:", err);
    }
  };

  const clearPath = () => {
    setPath([]);
    setStart(null);
    setEnd(null);
    setPathError("");
  };

  const getAIAdvice = async () => {
    setAiLoading(true);
    setAdvice("");
    try {
      const critical = graph.nodes.find((n) => n.load > 80) || graph.nodes[0];
      const res = await fetch("/api/ai-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          zone: critical.label,
          load: Math.round(critical.load),
        }),
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setAdvice((prev) => prev + decoder.decode(value));
      }
    } catch {
      setAdvice("Failed to fetch advice.");
    } finally {
      setAiLoading(false);
    }
  };

  const avgLoad = Math.round(
    graph.nodes.reduce((a, n) => a + n.load, 0) / graph.nodes.length,
  );
  const criticalCount = graph.nodes.filter((n) => n.load > 80).length;
  const activeEdges = graph.edges.filter((e) => !e.isBlocked).length;

  const statuses = [
    { label: "Grid", sub: "Stable", ok: true },
    { label: "Water", sub: floodActive ? "Burst" : "Normal", ok: !floodActive },
    { label: "Flood", sub: floodActive ? "Active" : "Clear", ok: !floodActive },
  ];

  const bg = dark ? "bg-[#0f1117]" : "bg-[#f0f0ea]";
  const card = dark ? "bg-[#1a1d27]" : "bg-white";
  const side = dark ? "bg-[#13151f]" : "bg-[#e8e8e2]";
  const txt = dark ? "text-gray-100" : "text-gray-900";
  const sub = dark ? "text-gray-400" : "text-gray-500";
  const bdr = dark ? "border-gray-800" : "border-gray-200";

  const modeStatus = {
    traffic: "Live",
    energy: "Ok",
    water: "—",
    disaster: floodActive ? "Active" : "Clear",
  };
  const modeStatusColor = {
    traffic: "text-green-400 bg-green-400/10",
    energy: "text-green-400 bg-green-400/10",
    water: dark ? "text-gray-500 bg-gray-700/30" : "text-gray-400 bg-gray-200",
    disaster: floodActive
      ? "text-red-400 bg-red-400/10"
      : "text-green-400 bg-green-400/10",
  };

  // Side panel renderer
  const renderSidePanel = () => {
    if (!sidePanel) return null;

    const panelTitles = {
      incident: "Incident Log",
      history: "Route History",
      citygraph: "City Graph",
    };

    return (
      <AnimatePresence>
        <motion.div
          key={sidePanel}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className={`w-72 ${side} border-r ${bdr} flex flex-col overflow-hidden flex-shrink-0`}
        >
          <div
            className={`flex items-center justify-between px-4 py-3 border-b ${bdr}`}
          >
            <p className={`text-sm font-semibold ${txt}`}>
              {panelTitles[sidePanel]}
            </p>
            <button
              onClick={() => setSidePanel(null)}
              className={`${sub} hover:${txt} transition-colors`}
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {/* Incident Log */}
            {sidePanel === "incident" && (
              <div className="flex flex-col gap-2">
                {alerts.length === 0 ? (
                  <p className={`text-xs ${sub}`}>No incidents recorded.</p>
                ) : (
                  alerts.map((a, i) => (
                    <div
                      key={a.ts + i}
                      className={`rounded-lg px-3 py-2.5 flex flex-col gap-0.5 border
                        ${
                          a.load > 90
                            ? dark
                              ? "border-red-500/30 bg-red-500/10"
                              : "border-red-200 bg-red-50"
                            : dark
                              ? "border-orange-500/20 bg-orange-500/10"
                              : "border-orange-200 bg-orange-50"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-semibold ${a.load > 90 ? "text-red-400" : "text-orange-400"}`}
                        >
                          {a.label}
                        </span>
                        <span className={`text-xs ${sub}`}>{a.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={sub}>
                          Load: <span className={txt}>{a.load}%</span>
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-xs ${modeStatusColor[a.mode] || ""}`}
                        >
                          {a.mode}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Route History */}
            {sidePanel === "history" && (
              <div className="flex flex-col gap-2">
                {path.length === 0 ? (
                  <p className={`text-xs ${sub}`}>
                    No routes computed yet. Click two nodes or use Auto-Route.
                  </p>
                ) : (
                  <div className={`rounded-lg p-3 border ${bdr} ${card}`}>
                    <p
                      className={`text-xs font-semibold uppercase tracking-widest ${sub} mb-2`}
                    >
                      Latest Route
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {path.map((id, i) => {
                        const node = graph.nodes.find((n) => n.id === id);
                        return (
                          <div
                            key={id}
                            className="flex items-center gap-2 text-xs"
                          >
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0
                                ${i === 0 ? "bg-green-500" : i === path.length - 1 ? "bg-blue-500" : "bg-gray-600"}`}
                            >
                              {i + 1}
                            </span>
                            <span className={txt}>{node?.label ?? id}</span>
                            {i < path.length - 1 && (
                              <ChevronRight size={10} className={sub} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <p className={`text-xs ${sub} mt-3`}>
                      {path.length - 1} hops · Dijkstra optimal
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* City Graph */}
            {sidePanel === "citygraph" && (
              <div className="flex flex-col gap-3">
                <div className={`rounded-lg p-3 border ${bdr} ${card}`}>
                  <p
                    className={`text-xs font-semibold uppercase tracking-widest ${sub} mb-2`}
                  >
                    Graph Summary
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { label: "Nodes", value: graph.nodes.length },
                      { label: "Edges", value: graph.edges.length },
                      { label: "Active Edges", value: activeEdges },
                      {
                        label: "Blocked Nodes",
                        value: graph.nodes.filter((n) => n.isBlocked).length,
                      },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className={`rounded-md p-2 ${dark ? "bg-[#0f1117]" : "bg-gray-50"}`}
                      >
                        <p className={`${sub} text-xs`}>{s.label}</p>
                        <p className={`font-bold text-lg ${txt}`}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`rounded-lg p-3 border ${bdr} ${card}`}>
                  <p
                    className={`text-xs font-semibold uppercase tracking-widest ${sub} mb-2`}
                  >
                    Nodes
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {graph.nodes.map((n) => (
                      <div
                        key={n.id}
                        className="flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0
                            ${n.isBlocked ? "bg-gray-600" : n.load > 80 ? "bg-red-500" : n.load > 60 ? "bg-orange-400" : "bg-green-500"}`}
                          >
                            {n.id}
                          </span>
                          <span
                            className={`${n.isBlocked ? sub : txt} truncate max-w-[130px]`}
                          >
                            {n.label}
                          </span>
                        </div>
                        <span
                          className={`font-mono ${n.isBlocked ? sub : n.load > 80 ? "text-red-400" : n.load > 60 ? "text-orange-400" : "text-green-400"}`}
                        >
                          {n.isBlocked ? "⛔" : `${Math.round(n.load)}%`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`rounded-lg p-3 border ${bdr} ${card}`}>
                  <p
                    className={`text-xs font-semibold uppercase tracking-widest ${sub} mb-2`}
                  >
                    Edges
                  </p>
                  <div className="flex flex-col gap-1">
                    {graph.edges.map((e, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between text-xs ${e.isBlocked ? "opacity-40" : ""}`}
                      >
                        <span className={sub}>
                          {e.from} → {e.to}
                        </span>
                        <span
                          className={`font-mono ${e.isBlocked ? "text-red-400" : txt}`}
                        >
                          {e.isBlocked ? "blocked" : `w:${e.weight ?? "—"}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className={`${bg} ${txt} min-h-screen flex flex-col font-sans`}>
      {/* Top Navbar */}
      <div
        className={`flex items-center justify-between px-5 py-3 border-b ${bdr} ${card}`}
      >
        <div className="flex items-center gap-2">
          <span className="font-black text-lg tracking-tight">
            UrbanTwins
            <span className={`text-xs font-normal ml-0.5 ${sub}`}>v2</span>
          </span>
          <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
            Live
          </span>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-2">
          {statuses.map((s) => (
            <div
              key={s.label}
              className={`px-3 py-1 rounded-lg border text-xs font-medium ${bdr}
              ${
                s.ok
                  ? dark
                    ? "bg-[#1a1d27] text-gray-300"
                    : "bg-white text-gray-700"
                  : "border-red-500/40 bg-red-500/10 text-red-400"
              }`}
            >
              <span className={`${sub} text-xs`}>{s.label}</span>
              <br />
              <span className="font-semibold">{s.sub}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-sm font-mono ${sub}`}>{time}</span>
          <button
            onClick={() => setDark(!dark)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${bdr} text-xs font-medium ${sub} hover:${txt} transition-all`}
          >
            {dark ? <Sun size={13} /> : <Moon size={13} />}
            {dark ? "Light" : "Dark"}
          </button>
          <UserButton />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Primary Sidebar */}
        <div
          className={`w-56 ${side} border-r ${bdr} flex flex-col p-4 gap-5 flex-shrink-0`}
        >
          <div>
            <p
              className={`text-xs font-semibold uppercase tracking-widest ${sub} mb-3`}
            >
              Systems
            </p>
            <div className="flex flex-col gap-1">
              {MODES.map((m) => {
                const Icon = m.icon;
                const active = mode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setMode(m.id);
                      clearPath();
                    }}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all
                      ${
                        active
                          ? dark
                            ? "bg-green-500/15 text-green-400 border-l-2 border-green-500"
                            : "bg-green-50 text-green-700 border-l-2 border-green-600"
                          : `${sub} hover:${txt} hover:bg-white/5`
                      }`}
                  >
                    <span className="flex items-center gap-2">
                      <Icon size={15} />
                      {m.label}
                    </span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${modeStatusColor[m.id]}`}
                    >
                      {modeStatus[m.id]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* System Health bars */}
          <div>
            <p
              className={`text-xs font-semibold uppercase tracking-widest ${sub} mb-3`}
            >
              System Health
            </p>
            <div className="flex flex-col gap-2.5">
              {Object.entries(systemHealth).map(([key, val]) => (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={`capitalize ${sub}`}>{key}</span>
                    <span className={txt}>{val}%</span>
                  </div>
                  <div
                    className={`h-1.5 rounded-full ${dark ? "bg-gray-800" : "bg-gray-200"}`}
                  >
                    <div
                      className={`h-1.5 rounded-full transition-all duration-700
                      ${val > 80 ? "bg-blue-500" : val > 60 ? "bg-green-500" : "bg-red-500"}`}
                      style={{ width: `${val}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tools — clickable */}
          <div>
            <p
              className={`text-xs font-semibold uppercase tracking-widest ${sub} mb-3`}
            >
              Tools
            </p>
            <div className="flex flex-col gap-1">
              {[
                { label: "Incident Log", icon: FileText, panel: "incident" },
                { label: "History", icon: History, panel: "history" },
                { label: "City Graph", icon: GitBranch, panel: "citygraph" },
              ].map((t) => {
                const Icon = t.icon;
                const isOpen = sidePanel === t.panel;
                return (
                  <button
                    key={t.label}
                    onClick={() => setSidePanel(isOpen ? null : t.panel)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all
                      ${
                        isOpen
                          ? dark
                            ? "bg-white/10 text-white"
                            : "bg-gray-900/10 text-gray-900"
                          : `${sub} hover:${txt} hover:bg-white/5`
                      }`}
                  >
                    <Icon size={14} />
                    {t.label}
                    {t.label === "Incident Log" && alerts.length > 0 && (
                      <span className="ml-auto text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5 font-bold leading-none">
                        {alerts.length > 9 ? "9+" : alerts.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Slide-out Tool Panel */}
        {renderSidePanel()}

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden p-4 gap-4">
          {/* Mode tabs */}
          <div
            className={`flex items-center gap-1 ${card} border ${bdr} rounded-xl p-1 w-fit`}
          >
            {MODES.map((m) => {
              const Icon = m.icon;
              const active = mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setMode(m.id);
                    clearPath();
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${
                      active
                        ? dark
                          ? "bg-green-600 text-white shadow"
                          : "bg-green-700 text-white shadow"
                        : `${sub} hover:${txt}`
                    }`}
                >
                  <Icon size={14} />
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3">
            {[
              {
                label: "TOTAL VEHICLES",
                value: (2800 + Math.round(avgLoad * 3)).toLocaleString(),
                badge: "Live",
                badgeColor: "text-green-400 bg-green-400/10",
              },
              {
                label: "AVG SPEED",
                value: `${Math.max(15, 60 - Math.round(avgLoad * 0.4))} km/h`,
                badge: avgLoad > 70 ? "Slow" : "Normal",
                badgeColor:
                  avgLoad > 70
                    ? "text-orange-400 bg-orange-400/10"
                    : "text-green-400 bg-green-400/10",
              },
              {
                label: "CONGESTION",
                value: avgLoad + "%",
                badge: criticalCount > 0 ? "Critical" : "Normal",
                badgeColor:
                  criticalCount > 0
                    ? "text-red-400 bg-red-400/10"
                    : "text-green-400 bg-green-400/10",
              },
              {
                label: "ACTIVE ROUTES",
                value: activeEdges,
                badge: "Dijkstra's",
                badgeColor: "text-blue-400 bg-blue-400/10",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`${card} border ${bdr} rounded-xl p-4`}
              >
                <p
                  className={`text-xs font-semibold uppercase tracking-widest ${sub} mb-1`}
                >
                  {stat.label}
                </p>
                <p className={`text-3xl font-black ${txt} leading-none mb-2`}>
                  {stat.value}
                </p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${stat.badgeColor}`}
                >
                  {stat.badge}
                </span>
              </div>
            ))}
          </div>

          {/* Map + Right panel */}
          <div className="flex gap-4 flex-1 overflow-hidden">
            {/* Map card */}
            <div
              className={`flex-1 ${card} border ${bdr} rounded-xl overflow-hidden flex flex-col`}
            >
              <div
                className={`flex items-center justify-between px-4 py-3 border-b ${bdr}`}
              >
                <div>
                  <p className={`font-semibold text-sm ${txt}`}>
                    City Road Network
                  </p>
                  <p className={`text-xs ${sub}`}>
                    {start
                      ? `Start: ${graph.nodes.find((n) => n.id === start)?.label} — click a destination node`
                      : "Click two nodes to find shortest path, or use Auto-Route"}
                  </p>
                </div>
                <div className="flex gap-2">
                  {mode === "disaster" && (
                    <button
                      onClick={floodActive ? resetFlood : triggerFlood}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                        ${floodActive ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse"}`}
                    >
                      {floodActive ? "Reset City" : "Trigger Flood"}
                    </button>
                  )}
                  {path.length > 0 && (
                    <button
                      onClick={clearPath}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${bdr} ${sub} hover:${txt} transition-all`}
                    >
                      Clear Path
                    </button>
                  )}
                  <button
                    onClick={runDijkstra}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                      ${dark ? "bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30" : "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"}`}
                  >
                    Auto-Route
                  </button>
                </div>
              </div>

              <div className="flex-1">
                <MapView
                  nodes={graph.nodes}
                  edges={graph.edges}
                  path={path}
                  onNodeClick={handleNodeClick}
                />
              </div>

              {/* Path error */}
              {pathError && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-4 py-2 border-t border-red-500/30 bg-red-500/10 flex items-center gap-2 text-xs text-red-400"
                >
                  <AlertCircle size={13} />
                  {pathError}
                </motion.div>
              )}

              {/* Path display */}
              {path.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`px-4 py-3 border-t ${bdr} font-mono text-sm`}
                >
                  <span className={`${sub} mr-2`}>Optimal path:</span>
                  <span className="text-blue-400 font-semibold">
                    {path
                      .map(
                        (id) =>
                          graph.nodes
                            .find((n) => n.id === id)
                            ?.label.split(" ")[0],
                      )
                      .join(" → ")}
                  </span>
                  <span className={`ml-3 text-xs ${sub}`}>
                    ({path.length - 1} hops)
                  </span>
                </motion.div>
              )}

              {/* Legend */}
              <div
                className={`flex items-center gap-4 px-4 py-2 border-t ${bdr} text-xs ${sub}`}
              >
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-green-500 inline-block rounded" />{" "}
                  Clear
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-orange-400 inline-block rounded" />{" "}
                  Moderate
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-red-500 inline-block rounded" />{" "}
                  Congested
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-blue-400 inline-block rounded" />{" "}
                  Shortest path
                </span>
              </div>
            </div>

            {/* Right panel */}
            <div className="w-72 flex flex-col gap-3 overflow-y-auto">
              {/* Live metrics */}
              <div className={`${card} border ${bdr} rounded-xl p-4`}>
                <p className={`text-sm font-semibold ${txt} mb-3`}>
                  Live Metrics
                </p>
                <div className="flex flex-col gap-3">
                  {graph.nodes.slice(0, 5).map((node) => (
                    <div key={node.id} className="flex items-center gap-2">
                      <span className={`text-xs w-24 truncate ${sub}`}>
                        {node.label}
                      </span>
                      <div
                        className={`flex-1 h-1.5 rounded-full ${dark ? "bg-gray-800" : "bg-gray-200"}`}
                      >
                        <motion.div
                          animate={{ width: `${node.load}%` }}
                          transition={{ duration: 0.8 }}
                          className={`h-1.5 rounded-full ${node.load > 80 ? "bg-red-500" : node.load > 60 ? "bg-orange-400" : "bg-green-500"}`}
                        />
                      </div>
                      <span
                        className={`text-xs font-mono w-8 text-right ${node.load > 80 ? "text-red-400" : node.load > 60 ? "text-orange-400" : "text-green-400"}`}
                      >
                        {Math.round(node.load)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Advisor */}
              <div className={`${card} border ${bdr} rounded-xl p-4 flex-1`}>
                <div className="flex items-center justify-between mb-1">
                  <p className={`text-sm font-semibold ${txt}`}>AI Advisor</p>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={getAIAdvice}
                    disabled={aiLoading}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border ${bdr} ${sub} hover:${txt} transition-all disabled:opacity-40`}
                  >
                    <RefreshCw
                      size={11}
                      className={aiLoading ? "animate-spin" : ""}
                    />
                    {aiLoading ? "Analyzing..." : "Refresh"}
                  </motion.button>
                </div>
                <p className={`text-xs ${sub} mb-3`}>
                  AI-powered recommendations
                </p>

                {advice || aiLoading ? (
                  <div
                    className={`${dark ? "bg-[#0f1117]" : "bg-gray-50"} rounded-lg p-3`}
                  >
                    <p
                      className={`text-xs font-semibold uppercase tracking-widest ${sub} mb-2`}
                    >
                      {mode.toUpperCase()} ANALYSIS
                    </p>
                    {aiLoading && !advice ? (
                      <p className={`text-xs ${sub} animate-pulse`}>
                        Analyzing city infrastructure...
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {advice
                          .split("\n")
                          .filter((l) => l.trim())
                          .slice(0, 4)
                          .map((line, i) => (
                            <div key={i} className="flex gap-2 text-xs">
                              <span className="w-4 h-4 rounded-full bg-green-500/20 text-green-400 flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5">
                                {i + 1}
                              </span>
                              <span className={`${txt} leading-relaxed`}>
                                {line
                                  .replace(/^\d+\.\s*/, "")
                                  .replace(/^\*+\s*/, "")}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className={`text-xs ${sub}`}>
                    Click Refresh for real-time recommendations.
                  </p>
                )}
              </div>

              {/* Alert Log */}
              <div className={`${card} border ${bdr} rounded-xl p-4`}>
                <div className="flex items-center justify-between mb-3">
                  <p className={`text-sm font-semibold ${txt}`}>Alert Log</p>
                  <span className={`text-xs ${sub}`}>
                    {alerts.length} events
                  </span>
                </div>
                <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                  <AnimatePresence>
                    {alerts.length === 0 ? (
                      <p className={`text-xs ${sub}`}>No alerts yet...</p>
                    ) : (
                      alerts.map((a, i) => (
                        <motion.div
                          key={a.id + a.ts}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`flex justify-between text-xs ${dark ? "bg-[#0f1117]" : "bg-gray-50"} rounded-lg px-3 py-2`}
                        >
                          <span
                            className={
                              a.load > 90 ? "text-red-400" : "text-orange-400"
                            }
                          >
                            {a.label}
                          </span>
                          <span className={sub}>{a.time}</span>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
