"use client";
import { Radio } from "lucide-react";
import MetricBar from "@/components/ui/MetricBar";

export default function MetricsPanel({
  theme,
  mode, accent,
  graph,
  stationLoads,
  zonePressures, z7Pressure, burstActive,
  // new algorithm fields
  rerouteEdges, affectedZones, networkStatus,
}) {
  const { card, bdr, txt, sub, fontBody } = theme;

  const title = {
    energy:   "Station Load",
    water:    "Zone Pressure",
    disaster: "Resources",
  }[mode] ?? "Live Metrics";

  const renderBars = () => {

    // ── Energy ──────────────────────────────────────────────────────────────
    if (mode === "energy") {
      return Object.entries(stationLoads).map(([k, v]) => (
        <MetricBar
          key={k}
          label={`Station ${k.slice(1)}`}
          pct={v}
          value={`${v}%`}
          color={v > 80 ? "#E24B4A" : v > 65 ? "#BA7517" : "#639922"}
          theme={theme}
        />
      ));
    }

    // ── Water — live from algorithm ──────────────────────────────────────────
    if (mode === "water") {
      // Filter out the source node, render every zone we have pressure data for
      const zones = Object.entries(zonePressures)
        .filter(([id]) => id !== "TP")
        .sort(([a], [b]) => a.localeCompare(b));

      return (
        <>
          {zones.map(([zoneId, pressure]) => {
            const p          = pressure ?? 0;
            const pct        = Math.min(100, Math.round((p / 4.0) * 100));
            const isBurst    = burstActive && affectedZones?.includes(zoneId);
            const isRerouted = rerouteEdges?.some((e) => e.from === zoneId || e.to === zoneId);
            const color      =
              p < 1.5 ? "#E24B4A" :
              p < 2.5 ? "#BA7517" : "#185FA5";

            return (
              <MetricBar
                key={zoneId}
                label={
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    {zoneId}
                    {isBurst    && <span style={{ fontSize: 9, color: "#E24B4A",  fontWeight: 600 }}>BURST</span>}
                    {isRerouted && <span style={{ fontSize: 9, color: "#BA7517",  fontWeight: 600 }}>REROUTED</span>}
                  </span>
                }
                pct={pct}
                value={`${p.toFixed(1)} bar`}
                color={color}
                theme={theme}
              />
            );
          })}

          {/* Network status footer */}
          {networkStatus && networkStatus !== "ok" && (
            <div
              style={{
                marginTop: 10,
                padding: "6px 10px",
                borderRadius: 6,
                background: networkStatus === "failed"   ? "rgba(226,75,74,0.08)"  :
                            networkStatus === "degraded" ? "rgba(186,117,23,0.08)" : "transparent",
                border: `0.5px solid ${
                  networkStatus === "failed"   ? "rgba(226,75,74,0.25)"  :
                  networkStatus === "degraded" ? "rgba(186,117,23,0.25)" : "transparent"
                }`,
              }}
            >
              <p style={{
                fontSize: 11, fontWeight: 600,
                color: networkStatus === "failed" ? "#E24B4A" : "#BA7517",
                marginBottom: rerouteEdges?.length > 0 ? 4 : 0,
              }}>
                {networkStatus === "failed"   ? "⚠ Network failure detected" :
                 networkStatus === "degraded" ? "⚠ Pressure degraded"        : ""}
              </p>
              {rerouteEdges?.length > 0 && (
                <p style={{ fontSize: 10, color: sub }}>
                  Rerouted via: {rerouteEdges.map((e) => `${e.from}→${e.to}`).join(", ")}
                </p>
              )}
            </div>
          )}
        </>
      );
    }

    // ── Disaster ─────────────────────────────────────────────────────────────
    if (mode === "disaster") {
      return [
        { name: "Shelters",  pct: 67, label: "12/18", color: "#639922" },
        { name: "Vehicles",  pct: 78, label: "47/60", color: "#BA7517" },
        { name: "Personnel", pct: 82, label: "246",   color: "#185FA5" },
        { name: "Hospitals", pct: 50, label: "3/6",   color: "#E24B4A" },
      ].map((r) => (
        <MetricBar key={r.name} label={r.name} pct={r.pct} value={r.label} color={r.color} theme={theme} />
      ));
    }

    // ── Traffic — node loads ──────────────────────────────────────────────────
    return graph.nodes.slice(0, 6).map((node) => (
      <MetricBar
        key={node.id}
        label={node.label.split(" ")[0]}
        pct={node.isBlocked ? 100 : node.load}
        value={node.isBlocked ? "⛔" : `${Math.round(node.load)}%`}
        extra={node.vehicles ? `${node.vehicles} vehicles` : undefined}
        color={
          node.isBlocked     ? "#378ADD" :
          node.load > 80     ? "#E24B4A" :
          node.load > 60     ? "#BA7517" : "#639922"
        }
        theme={theme}
      />
    ));
  };

  return (
    <div
      style={{
        background: card, border: `0.5px solid ${bdr}`,
        borderRadius: 10, padding: 14, flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: txt, fontFamily: fontBody }}>{title}</p>
        <Radio size={13} style={{ color: accent }} className="animate-pulse" />
      </div>
      {renderBars()}
    </div>
  );
}