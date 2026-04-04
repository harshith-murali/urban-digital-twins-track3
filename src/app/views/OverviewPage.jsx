"use client";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Sparkles, RefreshCw } from "lucide-react";
import dynamic from "next/dynamic";
import Badge from "@/components/ui/Badge";
import AIAdvisor from "@/components/AIAdvisor";
import AlertLog from "@/components/AlertLog";
import { MODES } from "@/app/constants/modes.js";
import { parseAdviceLines } from "@/lib/graphUtils";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

/**
 * The full Overview page layout:
 * 6-stat grid → map + system status + environment → incident log + AI advisor
 */
export default function OverviewPage({
  theme,
  mode, accent,
  graph,
  path, onNodeClick, runAutoRoute,
  alerts,
  avgLoad, criticalCount,
  avgStationLoad, burstActive,
  stationLoads,
}) {
  const { card, bdr, inputBg, sub, txt, fontBody, fontMono, dark } = theme;

  const STATS_OVERVIEW = [
    { label: "Vehicles",       value: (2800 + Math.round(avgLoad * 3)).toLocaleString(),          badge: "LIVE",                                       badgeType: "green" },
    { label: "Avg Speed",      value: `${Math.max(15, 60 - Math.round(avgLoad * 0.4))} km/h`,    badge: avgLoad > 70 ? "-6 from avg" : "On track",    badgeType: avgLoad > 70 ? "amber" : "green" },
    { label: "Grid Load",      value: `${avgStationLoad}%`,                                        badge: "Peak window",                                badgeType: "amber" },
    { label: "Water Pressure", value: "3.1 bar",                                                   badge: burstActive ? "BURST" : "+0.1 bar",           badgeType: burstActive ? "red" : "green" },
    { label: "Incidents",      value: alerts.length,                                               badge: `${criticalCount} critical`,                  badgeType: criticalCount > 0 ? "red" : "green" },
    { label: "Uptime",         value: "99.2%",                                                     badge: "30-day avg",                                 badgeType: "green" },
  ];

  const SYSTEM_STATUSES = [
    { label: "Traffic",  status: "Critical", color: "#E24B4A", bg: dark ? "rgba(163,45,45,0.10)"  : "#FCEBEB", textColor: "#A32D2D" },
    { label: "Energy",   status: "Warning",  color: "#BA7517", bg: dark ? "rgba(186,117,23,0.10)" : "#FAEEDA", textColor: "#633806" },
    { label: "Water",    status: "Critical", color: "#E24B4A", bg: dark ? "rgba(163,45,45,0.10)"  : "#FCEBEB", textColor: "#A32D2D" },
    { label: "Disaster", status: "Active",   color: "#E24B4A", bg: dark ? "rgba(163,45,45,0.10)"  : "#FCEBEB", textColor: "#A32D2D" },
  ];

  const ENV_DATA = [
    { val: "29°C",     lbl: "Temp"     },
    { val: "78%",      lbl: "Humidity" },
    { val: "High",     lbl: "Rainfall" },
    { val: "12 km/h",  lbl: "Wind"     },
    { val: "1012 hPa", lbl: "Pressure" },
    { val: "Mod",      lbl: "UV Index" },
  ];

  return (
    <>
      {/* 6-column stat grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10, flexShrink: 0 }}>
        {STATS_OVERVIEW.map((s) => (
          <div
            key={s.label}
            style={{
              background: card, border: `0.5px solid ${bdr}`,
              borderRadius: 10, padding: "12px 13px",
            }}
          >
            <p style={{ fontSize: 10, color: sub, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>
              {s.label}
            </p>
            <p style={{ fontSize: 19, fontWeight: 500, fontFamily: fontMono, color: txt }}>{s.value}</p>
            <Badge label={s.badge} type={s.badgeType} theme={theme} />
          </div>
        ))}
      </div>

      {/* Map + System Status + Environment */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 12, flex: 1, minHeight: 0 }}>

        {/* Map card */}
        <div
          style={{
            background: card, border: `0.5px solid ${bdr}`, borderRadius: 10,
            display: "flex", flexDirection: "column", overflow: "hidden",
          }}
        >
          <div
            style={{
              borderBottom: `0.5px solid ${bdr}`, padding: "11px 14px", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}
          >
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: txt }}>System overview map</p>
              <p style={{ fontSize: 11, color: sub, marginTop: 1 }}>All infrastructure layers · click nodes</p>
            </div>
            <button
              onClick={runAutoRoute}
              style={{
                fontSize: 11, fontFamily: fontBody, padding: "5px 10px", borderRadius: 6,
                border: `0.5px solid ${bdr}`, background: inputBg, color: sub, cursor: "pointer",
              }}
            >
              Run Dijkstra's
            </button>
          </div>

          <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
            <MapView nodes={graph.nodes} edges={graph.edges} path={path} onNodeClick={onNodeClick} />
          </div>

          {/* Legend */}
          <div
            style={{
              borderTop: `0.5px solid ${bdr}`, padding: "6px 14px", flexShrink: 0,
              display: "flex", gap: 16, flexWrap: "wrap",
            }}
          >
            {[
              { color: "#639922", label: "Clear" },
              { color: "#BA7517", label: "Moderate" },
              { color: "#E24B4A", label: "Congested" },
              { color: "#185FA5", label: "Optimal path" },
            ].map((l) => (
              <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: sub }}>
                <span style={{ width: 14, height: 3, background: l.color, display: "inline-block", borderRadius: 2 }} />
                {l.label}
              </span>
            ))}
          </div>
        </div>

        {/* Right column: System Status + Environment */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* System Status */}
          <div style={{ background: card, border: `0.5px solid ${bdr}`, borderRadius: 10, overflow: "hidden" }}>
            <div style={{ borderBottom: `0.5px solid ${bdr}`, padding: "11px 14px" }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: txt }}>System status</p>
            </div>
            <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
              {SYSTEM_STATUSES.map((s) => (
                <div
                  key={s.label}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "7px 9px", background: inputBg, borderRadius: 6,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 500, color: txt, display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.color, display: "inline-block" }} />
                    {s.label}
                  </span>
                  <span
                    style={{
                      fontSize: 10, padding: "2px 7px", borderRadius: 10, fontWeight: 500,
                      background: s.bg, color: s.textColor,
                    }}
                  >
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Environment */}
          <div style={{ background: card, border: `0.5px solid ${bdr}`, borderRadius: 10, overflow: "hidden" }}>
            <div style={{ borderBottom: `0.5px solid ${bdr}`, padding: "11px 14px" }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: txt }}>Environment</p>
            </div>
            <div style={{ padding: "10px 12px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
              {ENV_DATA.map((e) => (
                <div key={e.lbl} style={{ background: inputBg, borderRadius: 6, padding: "8px", textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 500, fontFamily: fontMono, color: txt }}>{e.val}</div>
                  <div style={{ fontSize: 10, color: sub, textTransform: "uppercase", letterSpacing: ".5px", marginTop: 2 }}>{e.lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row: Incident log + AI Advisor */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, flexShrink: 0 }}>
        {/* Incident log */}
        <div style={{ background: card, border: `0.5px solid ${bdr}`, borderRadius: 10, overflow: "hidden" }}>
          <div
            style={{
              borderBottom: `0.5px solid ${bdr}`, padding: "11px 14px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}
          >
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: txt }}>Incident log</p>
              <p style={{ fontSize: 11, color: sub, marginTop: 1 }}>{alerts.length} events</p>
            </div>
          </div>
          <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 5, maxHeight: 180, overflowY: "auto" }}>
            <AnimatePresence>
              {alerts.length === 0 ? (
                <p style={{ color: sub, fontSize: 12 }}>No incidents recorded.</p>
              ) : (
                alerts.slice(0, 6).map((a) => (
                  <motion.div
                    key={a.id + a.ts}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 8,
                      padding: "8px 10px", background: inputBg, borderRadius: 6,
                      borderLeft: `2px solid ${a.load > 90 ? "#E24B4A" : "#BA7517"}`,
                    }}
                  >
                    <div
                      style={{
                        width: 6, height: 6, borderRadius: "50%", marginTop: 4, flexShrink: 0,
                        background: a.load > 90 ? "#E24B4A" : "#BA7517",
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 10, fontWeight: 600, textTransform: "uppercase",
                          color: MODES.find((m) => m.id === a.mode)?.accent, letterSpacing: ".3px",
                        }}
                      >
                        {a.mode}
                      </div>
                      <div style={{ fontSize: 11, color: sub, marginTop: 1 }}>{a.label}</div>
                    </div>
                    <div style={{ fontSize: 10, fontFamily: fontMono, color: sub, flexShrink: 0 }}>{a.time}</div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* AI Advisor */}
        <AIAdvisor theme={theme} mode={mode} accent={accent} graph={graph} compact />
      </div>
    </>
  );
}