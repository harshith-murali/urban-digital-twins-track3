"use client";
import { Radio } from "lucide-react";
import MetricBar from "@/components/ui/MetricBar";

/**
 * Right-panel card showing live metric bars.
 * Content varies depending on the active mode.
 */
export default function MetricsPanel({
  theme,
  mode, accent,
  graph,
  stationLoads,
  zonePressures, z7Pressure, burstActive,
}) {
  const { card, bdr, txt, fontBody } = theme;

  const title = {
    energy:   "Station Load",
    water:    "Zone Pressure",
    disaster: "Resources",
  }[mode] ?? "Live Metrics";

  const renderBars = () => {
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

    if (mode === "water") {
      const waterMetrics = [
        { name: "Zone 1", pct: Math.round(((zonePressures.Z1 ?? 3.4) / 4) * 100), label: `${(zonePressures.Z1 ?? 3.4).toFixed(1)} bar`, color: "#185FA5" },
        { name: "Zone 3", pct: Math.round(((zonePressures.Z3 ?? 3.0) / 4) * 100), label: `${(zonePressures.Z3 ?? 3.0).toFixed(1)} bar`, color: "#185FA5" },
        { name: "Zone 5", pct: 70,                                                  label: "2.8 bar",                                      color: "#185FA5" },
        { name: "Zone 7", pct: Math.round((z7Pressure / 4) * 100),                 label: `${z7Pressure.toFixed(1)} bar`,                  color: burstActive ? "#E24B4A" : "#185FA5" },
        { name: "Zone 9", pct: 65,                                                  label: "2.6 bar",                                      color: "#185FA5" },
      ];
      return waterMetrics.map((m) => (
        <MetricBar key={m.name} label={m.name} pct={m.pct} value={m.label} color={m.color} theme={theme} />
      ));
    }

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

    // Traffic — node loads
    return graph.nodes.slice(0, 6).map((node) => (
      <MetricBar
        key={node.id}
        label={node.label.split(" ")[0]}
        pct={node.isBlocked ? 100 : node.load}
        value={node.isBlocked ? "⛔" : `${Math.round(node.load)}%`}
        color={node.isBlocked ? "#378ADD" : node.load > 80 ? "#E24B4A" : node.load > 60 ? "#BA7517" : "#639922"}
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
      <div
        style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between", marginBottom: 12,
        }}
      >
        <p style={{ fontSize: 13, fontWeight: 500, color: txt, fontFamily: fontBody }}>{title}</p>
        <Radio size={13} style={{ color: accent }} className="animate-pulse" />
      </div>
      {renderBars()}
    </div>
  );
}