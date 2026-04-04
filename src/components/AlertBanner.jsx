"use client";
import { AlertTriangle, Zap, Waves } from "lucide-react";

/**
 * Renders a contextual alert strip at the top of mode pages.
 * Returns null when there is nothing to show.
 */
export default function AlertBanner({
  theme,
  mode,
  floodActive, blockedCount,
  failedStation, stationLoads,
  burstActive, z7Pressure,
}) {
  const { sub, dark } = theme;

  if (mode === "disaster" && floodActive) {
    return (
      <div
        style={{
          display: "flex", alignItems: "flex-start", gap: 9,
          padding: "9px 12px", borderRadius: 6,
          borderLeft: "3px solid #E24B4A",
          background: dark ? "rgba(163,45,45,0.10)" : "#FCEBEB",
        }}
      >
        <AlertTriangle size={13} style={{ color: "#E24B4A", flexShrink: 0, marginTop: 1 }} />
        <div>
          <p style={{ color: "#A32D2D", fontSize: 12, fontWeight: 600 }}>
            CRITICAL — Flood active · {blockedCount} zones blocked
          </p>
          <p style={{ color: sub, fontSize: 11, marginTop: 1 }}>
            Evacuation routes via Dijkstra · 12 shelters open · Avoid flooded zones as destination
          </p>
        </div>
      </div>
    );
  }

  if (mode === "energy" && failedStation) {
    return (
      <div
        style={{
          display: "flex", alignItems: "flex-start", gap: 9,
          padding: "9px 12px", borderRadius: 6,
          borderLeft: "3px solid #BA7517",
          background: dark ? "rgba(186,117,23,0.10)" : "#FAEEDA",
        }}
      >
        <Zap size={13} style={{ color: "#BA7517", flexShrink: 0, marginTop: 1 }} />
        <div>
          <p style={{ color: "#633806", fontSize: 12, fontWeight: 600 }}>
            CRITICAL — MG Road substation failed
          </p>
          <p style={{ color: sub, fontSize: 11, marginTop: 1 }}>
            Load redistributed to Electronic City, Whitefield, Silk Board
          </p>
        </div>
      </div>
    );
  }

  if (mode === "energy" && !failedStation) {
    return (
      <div
        style={{
          display: "flex", alignItems: "flex-start", gap: 9,
          padding: "9px 12px", borderRadius: 6,
          borderLeft: "3px solid #BA7517",
          background: dark ? "rgba(186,117,23,0.07)" : "#FAEEDA",
        }}
      >
        <Zap size={13} style={{ color: "#BA7517", flexShrink: 0, marginTop: 1 }} />
        <div>
          <p style={{ color: "#633806", fontSize: 12, fontWeight: 600 }}>
            WARNING — MG Road substation approaching critical ({stationLoads.SA}%)
          </p>
          <p style={{ color: sub, fontSize: 11, marginTop: 1 }}>
            Peak window 18:00–21:00 · Max flow algorithm active
          </p>
        </div>
      </div>
    );
  }

  if (mode === "water" && burstActive) {
    return (
      <div
        style={{
          display: "flex", alignItems: "flex-start", gap: 9,
          padding: "9px 12px", borderRadius: 6,
          borderLeft: "3px solid #E24B4A",
          background: dark ? "rgba(163,45,45,0.10)" : "#FCEBEB",
        }}
      >
        <Waves size={13} style={{ color: "#E24B4A", flexShrink: 0, marginTop: 1 }} />
        <div>
          <p style={{ color: "#A32D2D", fontSize: 12, fontWeight: 600 }}>
            CRITICAL — Pipe burst in ORR Zone · Pressure {z7Pressure.toFixed(1)} bar (−58%)
          </p>
          <p style={{ color: sub, fontSize: 11, marginTop: 1 }}>
            Pipe age: 23yr · Rainfall: high · BWSSB crew ETA 28 min
          </p>
        </div>
      </div>
    );
  }

  return null;
}