"use client";
import { ChevronRight } from "lucide-react";

/**
 * Shows the last N computed Dijkstra routes with from/to labels and hop nodes.
 */
export default function RouteHistory({ theme, routeHistory, limit = 5 }) {
  const { card, bdr, inputBg, sub, txt, fontBody, fontMono } = theme;

  if (routeHistory.length === 0) return null;

  return (
    <div
      style={{
        background: card, border: `0.5px solid ${bdr}`,
        borderRadius: 10, padding: 14, flexShrink: 0,
      }}
    >
      <p style={{ fontSize: 13, fontWeight: 500, color: txt, marginBottom: 10, fontFamily: fontBody }}>
        Route History
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 130, overflowY: "auto" }}>
        {routeHistory.slice(0, limit).map((r, i) => (
          <div key={i} style={{ background: inputBg, borderRadius: 6, padding: 9 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: txt, fontFamily: fontBody }}>
                {r.from} → {r.to}
              </span>
              <span style={{ color: sub, fontSize: 10, fontFamily: fontMono }}>{r.time}</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 3, alignItems: "center" }}>
              {r.path.map((id, j) => (
                <span key={id} style={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <span
                    style={{
                      background: bdr, color: txt, fontSize: 10,
                      padding: "1px 5px", borderRadius: 3, fontFamily: fontMono,
                    }}
                  >
                    {id}
                  </span>
                  {j < r.path.length - 1 && <ChevronRight size={8} style={{ color: sub }} />}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}