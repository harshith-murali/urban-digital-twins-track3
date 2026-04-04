"use client";
import { useSharedState } from "@/app/context/SharedStateContext";
import { buildPageProps } from "@/lib/buildPageProps";

export default function AnalyticsRoute() {
  const state = useSharedState();
  const props = buildPageProps(state);
  const { theme, graph, avgLoad, criticalCount, activeEdges,
          energy, water, disaster } = state;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Header */}
      <div>
        <h2 style={{ margin: 0, fontFamily: theme.fontBody, fontSize: 20, fontWeight: 600 }}>
          Analytics
        </h2>
        <p style={{ margin: "4px 0 0", opacity: 0.5, fontSize: 13 }}>
          System-wide metrics across all modes
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        {[
          { label: "Avg Traffic Load", value: `${avgLoad}%`,        color: "#639922" },
          { label: "Critical Nodes",   value: criticalCount,         color: "#E53E3E" },
          { label: "Active Edges",     value: activeEdges,           color: "#3182CE" },
          { label: "Avg Station Load", value: `${energy.avgStationLoad ?? 0}%`, color: "#BA7517" },
          { label: "Water Pressure Z7",value: `${props.z7Pressure ?? "--"} bar`, color: "#185FA5" },
          { label: "Flood Status",     value: disaster.floodActive ? "ACTIVE" : "Clear", color: disaster.floodActive ? "#E53E3E" : "#38A169" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            style={{
              background: theme.card,
              border: `1px solid ${theme.border}`,
              borderRadius: 10,
              padding: "14px 16px",
            }}
          >
            <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {label}
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Node Load Table */}
      <div
        style={{
          background: theme.card,
          border: `1px solid ${theme.border}`,
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${theme.border}`, fontWeight: 600, fontSize: 14 }}>
          Node Load Overview
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: theme.bg }}>
                {["Node", "Label", "Load %", "Status", "Blocked"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left", padding: "8px 16px",
                      opacity: 0.5, fontWeight: 500, fontSize: 11,
                      textTransform: "uppercase", letterSpacing: "0.05em",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {graph.nodes.map((node, i) => {
                const load = Math.round(node.load);
                const statusColor = load > 80 ? "#E53E3E" : load > 50 ? "#D69E2E" : "#38A169";
                const statusLabel = load > 80 ? "Critical" : load > 50 ? "Moderate" : "Healthy";
                return (
                  <tr
                    key={node.id}
                    style={{
                      borderTop: `1px solid ${theme.border}`,
                      background: i % 2 === 0 ? "transparent" : theme.bg + "55",
                    }}
                  >
                    <td style={{ padding: "8px 16px", fontFamily: theme.fontMono, fontSize: 12 }}>
                      {node.id}
                    </td>
                    <td style={{ padding: "8px 16px" }}>{node.label}</td>
                    <td style={{ padding: "8px 16px" }}>
                      {/* Load bar */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: theme.border, borderRadius: 4, minWidth: 80 }}>
                          <div
                            style={{
                              width: `${load}%`, height: "100%",
                              background: statusColor, borderRadius: 4,
                              transition: "width 0.4s ease",
                            }}
                          />
                        </div>
                        <span style={{ minWidth: 32, textAlign: "right", fontFamily: theme.fontMono, fontSize: 12 }}>
                          {load}%
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "8px 16px" }}>
                      <span
                        style={{
                          background: statusColor + "22", color: statusColor,
                          padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600,
                        }}
                      >
                        {statusLabel}
                      </span>
                    </td>
                    <td style={{ padding: "8px 16px", fontFamily: theme.fontMono, fontSize: 12 }}>
                      {node.isBlocked ? (
                        <span style={{ color: "#E53E3E", fontWeight: 600 }}>Yes</span>
                      ) : (
                        <span style={{ opacity: 0.4 }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edge Summary */}
      <div
        style={{
          background: theme.card,
          border: `1px solid ${theme.border}`,
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${theme.border}`, fontWeight: 600, fontSize: 14 }}>
          Edge Summary
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: theme.bg }}>
                {["From", "To", "Weight", "Blocked"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left", padding: "8px 16px",
                      opacity: 0.5, fontWeight: 500, fontSize: 11,
                      textTransform: "uppercase", letterSpacing: "0.05em",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {graph.edges.map((edge, i) => (
                <tr
                  key={`${edge.from}-${edge.to}-${i}`}
                  style={{
                    borderTop: `1px solid ${theme.border}`,
                    background: i % 2 === 0 ? "transparent" : theme.bg + "55",
                    opacity: edge.isBlocked ? 0.45 : 1,
                  }}
                >
                  <td style={{ padding: "8px 16px", fontFamily: theme.fontMono, fontSize: 12 }}>{edge.from}</td>
                  <td style={{ padding: "8px 16px", fontFamily: theme.fontMono, fontSize: 12 }}>{edge.to}</td>
                  <td style={{ padding: "8px 16px" }}>{edge.weight ?? "—"}</td>
                  <td style={{ padding: "8px 16px" }}>
                    {edge.isBlocked ? (
                      <span style={{ color: "#E53E3E", fontWeight: 600 }}>Blocked</span>
                    ) : (
                      <span style={{ opacity: 0.4 }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}