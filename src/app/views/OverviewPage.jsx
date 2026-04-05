"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import AIAdvisor from "@/components/AIAdvisor";
import { MODES } from "@/app/constants/modes.js";
import { useCountUp } from "@/app/hooks/useCountUp";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

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
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Animated counters
  const animatedLoad     = useCountUp(mounted ? Math.round(avgLoad) : 0);
  const animatedVolume   = useCountUp(mounted ? 2800 + Math.round(avgLoad * 3) : 0);
  const animatedStation  = useCountUp(mounted ? avgStationLoad : 0);
  const animatedIncidents = useCountUp(mounted ? alerts.length : 0);

  const handleExport = useCallback(() => {
    const rows = [
      ["Metric", "Value", "Status"],
      ["Congestion", `${Math.round(avgLoad)}%`, avgLoad > 75 ? "Critical" : "Normal"],
      ["Traffic Volume", 2800 + Math.round(avgLoad * 3), "Live"],
      ["Grid Load", `${avgStationLoad}%`, avgStationLoad > 75 ? "High" : "Stable"],
      ["Water Pressure", "3.1 bar", burstActive ? "BURST" : "Normal"],
      ["Incidents", alerts.length, alerts.length > 0 ? "Active" : "Clear"],
      ["Uptime", "99.2%", "Stable"],
      ["Generated", new Date().toLocaleString(), ""],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `urban-twins-report-${Date.now()}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }, [avgLoad, avgStationLoad, burstActive, alerts.length]);

  const congestionSpeed = Math.max(15, 60 - Math.round(avgLoad * 0.4));
  const systemCritical = criticalCount > 0 || avgLoad > 80 || burstActive;
  const statusBarColor = systemCritical ? "#E24B4A" : "#639922";
  const statusBarLabel = systemCritical ? "System alert: critical conditions detected" : "All systems nominal";

  const STATS_OVERVIEW = [
    {
      label: "Congestion",
      value: `${Math.round(avgLoad)}%`,
      animatedValue: `${animatedLoad}%`,
      detail: `${congestionSpeed} km/h avg`,
      badge: avgLoad > 75 ? "Critical" : avgLoad > 60 ? "Warning" : "Normal",
      badgeType: avgLoad > 75 ? "red" : avgLoad > 60 ? "amber" : "green",
      topBorder: avgLoad > 75 ? "#E24B4A" : avgLoad > 60 ? "#BA7517" : "#639922",
      span: 5,
    },
    {
      label: "Traffic volume",
      value: (2800 + Math.round(avgLoad * 3)).toLocaleString(),
      animatedValue: animatedVolume.toLocaleString(),
      detail: "vehicles · live",
      badge: "LIVE",
      badgeType: "green",
      topBorder: "#639922",
      span: 3,
    },
    {
      label: "Grid Load",
      value: `${avgStationLoad}%`,
      animatedValue: `${animatedStation}%`,
      detail: "Peak window",
      badge: avgStationLoad > 75 ? "High load" : "Stable",
      badgeType: avgStationLoad > 75 ? "amber" : "green",
      topBorder: "#BA7517",
      span: 2,
    },
    {
      label: "Water Pressure",
      value: "3.1 bar",
      detail: burstActive ? "Burst active" : "+0.1 bar",
      badge: burstActive ? "BURST" : "+0.1 bar",
      badgeType: burstActive ? "red" : "green",
      topBorder: burstActive ? "#E24B4A" : "#639922",
      span: 2,
    },
    {
      label: "Incidents",
      value: alerts.length,
      animatedValue: animatedIncidents,
      detail: `${criticalCount} critical`,
      badge: "Events",
      badgeType: criticalCount > 0 ? "red" : "green",
      topBorder: criticalCount > 0 ? "#E24B4A" : "#639922",
      span: 3,
    },
    {
      label: "Uptime",
      value: "99.2%",
      detail: "30-day SLA avg",
      badge: "Enterprise",
      badgeType: "green",
      topBorder: "#639922",
      span: 3,
    },
  ];

  const topStats = STATS_OVERVIEW.slice(0, 4);
  const bottomStats = STATS_OVERVIEW.slice(4);

  const systemLegend = [
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

  const trendPoints = (base) => Array.from({ length: 7 }, (_, idx) => {
    const offset = (idx - 3) * 0.035;
    return Math.max(0, Math.min(1, base / 100 + offset + Math.sin(idx * 1.1) * 0.02));
  });

  const renderSparkline = (base, color) => {
    const points = trendPoints(base);
    const path = points
      .map((value, idx) => `${(idx * 16) + 2},${24 - value * 16}`)
      .join(" ");
    return (
      <svg width="128" height="28" viewBox="0 0 128 28" style={{ display: "block", marginTop: 10 }}>
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={path}
        />
      </svg>
    );
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1, height: 3, borderRadius: 999, background: statusBarColor, boxShadow: `0 0 12px ${statusBarColor}20` }} />
        <div style={{ fontSize: 11, color: systemCritical ? "#E24B4A" : "#639922", fontFamily: fontBody, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em" }}>
          {statusBarLabel}
        </div>
        {/* SLA badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: dark ? "rgba(99,153,34,0.12)" : "#EAF3DE", border: "0.5px solid rgba(99,153,34,0.3)" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#639922", letterSpacing: "0.3px" }}>SLA 99.2%</span>
        </div>
        {/* Export button */}
        <button
          onClick={handleExport}
          title="Download system report as CSV"
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "4px 10px", borderRadius: 6, fontSize: 11, fontFamily: fontBody,
            fontWeight: 500, cursor: "pointer",
            background: dark ? "rgba(255,255,255,0.04)" : inputBg,
            border: `0.5px solid ${bdr}`, color: sub,
            transition: "all 0.15s",
          }}
        >
          ↓ Export Report
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0,1fr))", gap: 10, flexShrink: 0 }}>
        {topStats.map((s, index) => (
          <div
            key={s.label}
            style={{
              background: card,
              border: `0.5px solid ${bdr}`,
              borderRadius: 12,
              padding: "15px 16px",
              gridColumn: `span ${s.span}`,
              borderTop: `4px solid ${s.topBorder}`,
              boxShadow: index === 0 ? `0 12px 28px ${s.topBorder}15` : undefined,
              transition: "box-shadow 0.3s",
            }}
          >
            <p style={{ fontSize: 11, color: sub, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 8 }}>
              {s.label}
            </p>
            <p style={{ fontSize: 26, fontWeight: 700, fontFamily: fontMono, color: txt, margin: 0 }}>
              {mounted ? s.animatedValue ?? s.value : <Skeleton width={80} height={28} radius={6} />}
            </p>
            <p style={{ margin: "6px 0 0", fontSize: 12, color: sub, fontFamily: fontMono }}>
              {mounted ? s.detail : <Skeleton width={60} height={12} radius={4} />}
            </p>
            {mounted && renderSparkline(parseInt(s.value, 10) || 50, s.topBorder)}
            <Badge label={mounted ? s.badge : ""} type={s.badgeType} theme={theme} />
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0,1fr))", gap: 10, marginTop: 10 }}>
        {bottomStats.map((s) => (
          <div
            key={s.label}
            style={{
              background: card,
              border: `0.5px solid ${bdr}`,
              borderRadius: 10,
              padding: "12px 13px",
              gridColumn: `span ${s.span}`,
              borderTop: `3px solid ${s.topBorder}`,
            }}
          >
            <p style={{ fontSize: 10, color: sub, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>
              {s.label}
            </p>
            <p style={{ fontSize: 18, fontWeight: 600, fontFamily: fontMono, color: txt, margin: 0 }}>
              {mounted ? s.animatedValue ?? s.value : <Skeleton width={64} height={22} radius={5} />}
            </p>
            <p style={{ margin: "6px 0 0", fontSize: 11, color: sub, fontFamily: fontMono }}>
              {mounted ? s.detail : <Skeleton width={50} height={11} radius={4} />}
            </p>
            <Badge label={mounted ? s.badge : ""} type={s.badgeType} theme={theme} />
          </div>
        ))}
      </div>

      {/* Map + System Status + Environment */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 12, flex: 1, minHeight: 0, background: inputBg, border: `0.5px solid ${bdr}`, borderRadius: 14, padding: 12 }}>

        {/* Map card */}
        <div style={{ background: card, border: `0.5px solid ${bdr}`, borderRadius: 14, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
          <div style={{ borderBottom: `0.5px solid ${bdr}`, padding: "14px 16px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: txt }}>System overview map</p>
              <p style={{ fontSize: 11, color: sub, marginTop: 1 }}>All infrastructure layers · click nodes</p>
            </div>
            <button
              onClick={runAutoRoute}
              style={{ fontSize: 11, fontFamily: fontBody, padding: "6px 12px", borderRadius: 8, border: `0.5px solid ${bdr}`, background: inputBg, color: sub, cursor: "pointer" }}
            >
              {"Run Dijkstra's"}
            </button>
          </div>

          <div style={{ flex: 1, minHeight: 0, overflow: "hidden", position: "relative", borderRadius: 10 }}>
            <MapView
              nodes={graph.nodes}
              edges={graph.edges}
              path={path}
              onNodeClick={onNodeClick}
              mode={mode}
              theme={theme}
              showEdges={false}
              showNodeLabels={true}
            />
            {criticalCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  position: "absolute",
                  left: 16,
                  bottom: 16,
                  padding: "10px 14px",
                  borderRadius: 999,
                  background: dark ? "rgba(16,20,35,0.95)" : "rgba(255,255,255,0.92)",
                  border: `1px solid ${bdr}`,
                  boxShadow: "0 18px 36px rgba(0,0,0,0.12)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#E24B4A", boxShadow: "0 0 0 6px rgba(226,75,74,0.12)" }} />
                <div style={{ color: txt, fontSize: 12, fontWeight: 600, fontFamily: fontBody }}>
                  {criticalCount} Issue{criticalCount === 1 ? "" : "s"} detected
                </div>
              </motion.div>
            )}
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
              {systemLegend.map((s) => (
                <div
                  key={s.label}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 9px", background: inputBg, borderRadius: 6 }}
                >
                  <span style={{ fontSize: 12, fontWeight: 500, color: txt, display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.color, display: "inline-block" }} />
                    {s.label}
                  </span>
                  <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, fontWeight: 500, background: s.bg, color: s.textColor }}>
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

      {/* Bottom row: Incident log + AI Advisor + Emergency Contacts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 280px", gap: 12, flexShrink: 0 }}>
        {/* Incident log */}
        <div style={{ background: card, border: `0.5px solid ${bdr}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ borderBottom: `0.5px solid ${bdr}`, padding: "11px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
                    <div style={{ width: 6, height: 6, borderRadius: "50%", marginTop: 4, flexShrink: 0, background: a.load > 90 ? "#E24B4A" : "#BA7517" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: MODES.find((m) => m.id === a.mode)?.accent, letterSpacing: ".3px" }}>
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

        {/* Emergency Contacts */}
        <div style={{ background: card, border: `0.5px solid ${bdr}`, borderRadius: 10, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ borderBottom: `0.5px solid rgba(226,75,74,0.3)`, padding: "11px 14px", display: "flex", alignItems: "center", gap: 8, background: dark ? "rgba(163,45,45,0.08)" : "rgba(252,235,235,0.6)" }}>
            <span style={{ fontSize: 16 }}>🚨</span>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#A32D2D" }}>Emergency Contacts</p>
          </div>
          <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
            {[
              { name: "Control Room A", number: "9845767548" },
              { name: "Control Room B", number: "9012754329" },
            ].map((contact) => (
              <div
                key={contact.number}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 12px", background: inputBg, borderRadius: 8,
                  border: `0.5px solid ${bdr}`,
                }}
              >
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: txt }}>{contact.name}</div>
                  <div style={{ fontSize: 12, fontFamily: fontMono, color: sub, marginTop: 2 }}>{contact.number}</div>
                </div>
                <a
                  href={`tel:${contact.number}`}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "6px 12px", borderRadius: 6,
                    background: dark ? "rgba(163,45,45,0.15)" : "#FCEBEB",
                    border: "0.5px solid rgba(226,75,74,0.3)",
                    color: "#A32D2D", textDecoration: "none",
                    fontSize: 11, fontWeight: 600, cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                >
                  <span style={{ fontSize: 13 }}>📞</span> Call
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}