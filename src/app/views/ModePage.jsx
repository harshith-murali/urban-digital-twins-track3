"use client";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, AlertCircle, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import Badge from "@/components/ui/Badge";
import AlertBanner from "@/components/AlertBanner";
import ActionButtons from "@/components/ActionButtons";
import MetricsPanel from "@/components/MetricsPanel";
import AIAdvisor from "@/components/AIAdvisor";
import AlertLog from "@/components/AlertLog";
import RouteHistory from "@/components/RouteHistory";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

export default function ModePage({
  theme,
  mode, accent, currentMode,
  page,
  graph,
  path, start, pathError,
  onNodeClick, runAutoRoute, clearPath, setPathError,
  routeHistory,
  alerts,
  floodActive, blockedCount, handleTriggerFlood, handleResetFlood,
  failedStation, stationLoads, avgStationLoad, handleSimulateFailure, handleResetEnergy,
  burstActive, zonePressures, z7Pressure, handleSimulateBurst, handleResetWater,
  avgLoad, criticalCount, activeEdges,
}) {
  const { card, bdr, inputBg, sub, txt, fontBody, fontMono, dark } = theme;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const PAGE_STATS = {
    traffic: [
      { label: "Total Vehicles", value: (2800 + Math.round(avgLoad * 3)).toLocaleString(), badge: "Live", badgeType: "green" },
      { label: "Avg Speed",      value: `${Math.max(15, 60 - Math.round(avgLoad * 0.4))} km/h`, badge: avgLoad > 70 ? "Below avg" : "Good", badgeType: avgLoad > 70 ? "amber" : "green" },
      { label: "Congestion",     value: `${avgLoad}%`, badge: criticalCount > 0 ? "Critical" : "Normal", badgeType: criticalCount > 0 ? "red" : "green" },
      { label: "Active Routes",  value: activeEdges, badge: "Dijkstra's", badgeType: "neutral" },
    ],
    energy: [
      { label: "Avg Load",        value: `${avgStationLoad}%`, badge: "Peak", badgeType: "amber" },
      { label: "Active Stations", value: failedStation ? "6/7" : "7/7", badge: failedStation ? "1 Failed" : "All on", badgeType: failedStation ? "red" : "green" },
      { label: "Grid Flow",       value: "2.4 GW", badge: "Max Flow", badgeType: "amber" },
      { label: "Efficiency",      value: "91%", badge: "+2%", badgeType: "green" },
    ],
    water: [
      { label: "System Pressure", value: "3.2 bar", badge: "Normal", badgeType: "blue" },
      { label: "Zone 7 Pressure", value: `${z7Pressure.toFixed(1)} bar`, badge: burstActive ? "BURST" : "OK", badgeType: burstActive ? "red" : "blue" },
      { label: "Active Pipes",    value: burstActive ? "24/26" : "26/26", badge: burstActive ? "1 Burst" : "All Clear", badgeType: burstActive ? "red" : "green" },
      { label: "MST Coverage",    value: "100%", badge: "Prim's", badgeType: "neutral" },
    ],
    disaster: [
      { label: "Flood Level", value: floodActive ? "Severe" : "Standby", badge: floodActive ? `${blockedCount} zones` : "Monitoring", badgeType: floodActive ? "red" : "green" },
      { label: "Shelters",    value: "12/18", badge: "Available", badgeType: "green" },
      { label: "Vehicles",    value: "47", badge: "Deployed", badgeType: "amber" },
      { label: "Evacuation",  value: floodActive ? "Active" : "Standby", badge: floodActive ? "Rerouted" : "Ready", badgeType: floodActive ? "red" : "green" },
    ],
    analytics: [
      { label: "Avg Response",  value: "4.2 min", badge: "-0.8 min",    badgeType: "green"   },
      { label: "Incidents 30d", value: "142",      badge: "+12 this wk", badgeType: "amber"   },
      { label: "Algo Runs",     value: "1,847",    badge: "Today",       badgeType: "neutral" },
      { label: "AI Accuracy",   value: "94%",      badge: "+2% MoM",     badgeType: "green"   },
    ],
  };

  const stats = PAGE_STATS[page] ?? PAGE_STATS.traffic;
  const originLabel = graph.nodes.find((n) => n.id === start)?.label;

  return (
    <>
      {/* 4-column stat row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, flexShrink: 0 }}>
        {stats.map((stat) => (
          <div
            key={stat.label}
            style={{ background: card, border: `0.5px solid ${bdr}`, borderRadius: 10, padding: "12px 13px" }}
          >
            <p style={{ fontSize: 10, color: sub, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>
              {stat.label}
            </p>
            <p style={{ fontSize: 19, fontWeight: 500, fontFamily: fontMono, color: txt }}>
              {mounted ? stat.value : "—"}
            </p>
            <Badge label={stat.badge} type={stat.badgeType} theme={theme} />
          </div>
        ))}
      </div>

      {/* Alert banner */}
      <AlertBanner
        theme={theme} mode={mode}
        floodActive={floodActive}     blockedCount={blockedCount}
        failedStation={failedStation} stationLoads={stationLoads}
        burstActive={burstActive}     z7Pressure={z7Pressure}
      />

      {/* Map + right panel */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 12, flex: 1, minHeight: 0 }}>

        {/* Map card */}
        <div style={{ background: card, border: `0.5px solid ${bdr}`, borderRadius: 10, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Map header */}
          <div style={{ borderBottom: `0.5px solid ${bdr}`, padding: "11px 14px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: txt }}>
                City Road Network
                <span style={{ color: sub, fontWeight: 400, fontSize: 12, marginLeft: 8 }}>{currentMode.label} Mode</span>
              </p>
              <p style={{ color: sub, fontSize: 11, marginTop: 2 }}>
                {start ? `Origin: ${originLabel} — select destination` : "Click two nodes to route · Auto-Route for random path"}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <ActionButtons
                theme={theme} mode={mode}
                floodActive={floodActive}     handleTriggerFlood={handleTriggerFlood} handleResetFlood={handleResetFlood}
                failedStation={failedStation} handleSimulateFailure={handleSimulateFailure} handleResetEnergy={handleResetEnergy}
                burstActive={burstActive}     handleSimulateBurst={handleSimulateBurst}    handleResetWater={handleResetWater}
              />
              {path.length > 0 && (
                <button
                  onClick={clearPath}
                  style={{ fontSize: 11, fontFamily: fontBody, padding: "5px 10px", borderRadius: 6, border: `0.5px solid ${bdr}`, background: inputBg, color: sub, cursor: "pointer" }}
                >
                  Clear
                </button>
              )}
              <button
                onClick={runAutoRoute}
                style={{
                  fontSize: 11, fontFamily: fontBody, padding: "5px 10px", borderRadius: 6,
                  border: `0.5px solid ${dark ? "rgba(59,109,17,0.30)" : "rgba(59,109,17,0.25)"}`,
                  background: dark ? "rgba(59,109,17,0.10)" : "#EAF3DE",
                  color: "#27500A", cursor: "pointer", fontWeight: 500,
                }}
              >
                Auto-Route
              </button>
            </div>
          </div>

          {/* Map */}
          <div style={{ flex: 1, minHeight: 0, overflow: "hidden", position: "relative" }}>
            <MapView
              nodes={graph.nodes}
              edges={graph.edges}
              path={path}
              onNodeClick={onNodeClick}
              mode={mode}
            />
            {/* Empty state hint — shown when no route and no first node selected */}
            {path.length === 0 && !start && (
              <div style={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                pointerEvents: "none", zIndex: 1000, textAlign: "center",
              }}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  style={{
                    background: "rgba(18,22,34,0.82)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 14,
                    padding: "12px 20px",
                    display: "flex", alignItems: "center", gap: 10,
                  }}
                >
                  <span style={{ fontSize: 18 }}>🗺️</span>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#e8eaf0" }}>Click a node to start routing</div>
                    <div style={{ fontSize: 11, color: "rgba(232,234,240,0.55)", marginTop: 2 }}>
                      Select origin → destination to run Dijkstra's
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </div>


          {/* Path error bar */}
          <AnimatePresence>
            {pathError && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ borderTop: "1px solid rgba(226,75,74,0.25)", background: dark ? "rgba(163,45,45,0.08)" : "#FCEBEB", color: "#A32D2D", padding: "7px 14px", fontSize: 12, flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}
              >
                <AlertCircle size={12} />
                {pathError}
                <button onClick={() => setPathError("")} style={{ marginLeft: "auto", opacity: 0.6, background: "none", border: "none", cursor: "pointer" }}>
                  <X size={11} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Optimal path display */}
          <AnimatePresence>
            {path.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ borderTop: `0.5px solid ${bdr}`, padding: "8px 14px", fontSize: 12, flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}
              >
                <MapPin size={12} style={{ color: "#3B6D11", flexShrink: 0 }} />
                <span style={{ color: sub }}>Optimal:</span>
                <span style={{ color: "#3B6D11", fontWeight: 600 }}>
                  {path.map((id) => graph.nodes.find((n) => n.id === id)?.label?.split(" ")[0]).join(" → ")}
                </span>
                <span style={{ color: sub, marginLeft: 8 }}>{path.length - 1} hops</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Legend */}
          <div style={{ borderTop: `0.5px solid ${bdr}`, padding: "6px 14px", flexShrink: 0, display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[
              { color: "#639922", label: "Clear"        },
              { color: "#BA7517", label: "Moderate"     },
              { color: "#E24B4A", label: "Congested"    },
              { color: "#185FA5", label: "Optimal path" },
            ].map((l) => (
              <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: sub }}>
                <span style={{ width: 14, height: 3, background: l.color, display: "inline-block", borderRadius: 2 }} />
                {l.label}
              </span>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" }}>
          <MetricsPanel theme={theme} mode={mode} accent={accent} graph={graph} stationLoads={stationLoads} zonePressures={zonePressures} z7Pressure={z7Pressure} burstActive={burstActive} />
          <AIAdvisor theme={theme} mode={mode} accent={accent} graph={graph} />
          <AlertLog theme={theme} alerts={alerts} />
          <RouteHistory theme={theme} routeHistory={routeHistory} />
        </div>
      </div>
    </>
  );
}