"use client";
import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
import { useSharedState } from "@/app/context/SharedStateContext";
import { buildPageProps } from "@/lib/buildPageProps";

Chart.register(...registerables);

const TGRAY = "#888780";
const TGRID = "rgba(136,135,128,.1)";

const algorithmLog = [
  { time: "18:42", algo: "Dijkstra's",     mode: "Traffic",  modeColor: "#3B6D11", nodes: 12, result: "7 hops",   exec: "48ms" },
  { time: "18:38", algo: "Ford-Fulkerson", mode: "Energy",   modeColor: "#633806", nodes: 8,  result: "3.2 GW",   exec: "62ms" },
  { time: "18:21", algo: "Prim's MST",     mode: "Water",    modeColor: "#185FA5", nodes: 10, result: "26 edges", exec: "31ms" },
  { time: "17:55", algo: "Dijkstra's",     mode: "Disaster", modeColor: "#A32D2D", nodes: 12, result: "5 hops",   exec: "55ms" },
  { time: "17:30", algo: "Dijkstra's",     mode: "Traffic",  modeColor: "#3B6D11", nodes: 12, result: "6 hops",   exec: "43ms" },
  { time: "17:10", algo: "Ford-Fulkerson", mode: "Energy",   modeColor: "#633806", nodes: 8,  result: "2.9 GW",   exec: "58ms" },
];

// ── Reusable chart hook ───────────────────────────────────────────────────────
function useChart(ref, config) {
  useEffect(() => {
    if (!ref.current) return;
    const chart = new Chart(ref.current, config);
    return () => chart.destroy();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export default function AnalyticsRoute() {
  const state = useSharedState();
  const props = buildPageProps(state);
  const { theme, graph, avgLoad, criticalCount, activeEdges } = state;
  const { failedStation, avgStationLoad } = state.energy ?? {};
  const { burstActive, z7Pressure }       = state.water   ?? {};
  const { floodActive }                   = state.disaster ?? {};

  const incidentChartRef    = useRef(null);
  const responseChartRef    = useRef(null);

  // ── Incidents by mode stacked bar ─────────────────────────────────────────
  useChart(incidentChartRef, {
    type: "bar",
    data: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
      datasets: [
        { label: "Traffic",  data: [18,22,15,20,25,19,21,24], backgroundColor: "#97C459", borderRadius: 3, borderSkipped: false },
        { label: "Energy",   data: [8,10,9,11,8,12,10,9],     backgroundColor: "#EF9F27", borderRadius: 3, borderSkipped: false },
        { label: "Water",    data: [6,7,8,5,9,7,6,8],         backgroundColor: "#85B7EB", borderRadius: 3, borderSkipped: false },
        { label: "Disaster", data: [3,4,2,5,3,4,6,3],         backgroundColor: "#F09595", borderRadius: 3, borderSkipped: false },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { stacked: true, ticks: { color: TGRAY, font: { size: 10 } }, grid: { color: TGRID } },
        y: { stacked: true, ticks: { color: TGRAY, font: { size: 10 } }, grid: { color: TGRID } },
      },
    },
  });

  // ── Response time trend line ───────────────────────────────────────────────
  useChart(responseChartRef, {
    type: "line",
    data: {
      labels: ["Wk1","Wk2","Wk3","Wk4","Wk5","Wk6","Wk7","Wk8"],
      datasets: [{
        label: "Avg Response",
        data: [6.2, 5.8, 5.1, 4.9, 5.3, 4.6, 4.4, 4.2],
        borderColor: "#3B6D11", backgroundColor: "rgba(59,109,17,.08)",
        fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: "#3B6D11",
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: TGRAY, font: { size: 10 } }, grid: { color: TGRID } },
        y: { ticks: { color: TGRAY, font: { size: 10 }, callback: (v) => v + "m" }, grid: { color: TGRID } },
      },
    },
  });

  // ── Styles ────────────────────────────────────────────────────────────────
  const card = {
    background: theme.card,
    border: `1px solid ${theme.border}`,
    borderRadius: 10,
    overflow: "hidden",
  };
  const cardHeader = {
    padding: "12px 16px",
    borderBottom: `1px solid ${theme.border}`,
    display: "flex", alignItems: "center", justifyContent: "space-between",
  };
  const thStyle = {
    textAlign: "left", padding: "8px 16px",
    opacity: 0.45, fontWeight: 500, fontSize: 11,
    textTransform: "uppercase", letterSpacing: "0.05em",
    whiteSpace: "nowrap",
  };
  const tdStyle = { padding: "8px 16px", fontSize: 13 };

  // ── KPI data ──────────────────────────────────────────────────────────────
  const kpis = [
    { label: "Avg Response Time", value: "4.2 min",  badge: "-0.8 min",       badgeColor: "#27500A", badgeBg: "#EAF3DE" },
    { label: "Incidents (30d)",   value: "142",       badge: "+12 this wk",    badgeColor: "#7C3B0A", badgeBg: "#FAEEDA" },
    { label: "Algorithm Runs",    value: "1,847",     badge: "Today",          badgeColor: "#185FA5", badgeBg: "#EAF0FA" },
    { label: "AI Accuracy",       value: "94%",       badge: "+2% MoM",        badgeColor: "#27500A", badgeBg: "#EAF3DE" },
  ];

  const legendItems = [
    { label: "Traffic",  count: 58, color: "#639922" },
    { label: "Energy",   count: 34, color: "#BA7517" },
    { label: "Water",    count: 28, color: "#185FA5" },
    { label: "Disaster", count: 22, color: "#E24B4A" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Header ── */}
      <div>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Analytics</h2>
        <p style={{ margin: "3px 0 0", opacity: 0.45, fontSize: 13 }}>
          System-wide metrics across all modes
        </p>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        {kpis.map(({ label, value, badge, badgeColor, badgeBg }) => (
          <div key={label} style={{ ...card, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, opacity: 0.45, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {label}
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
              <span style={{ fontSize: 26, fontWeight: 700, lineHeight: 1 }}>{value}</span>
              <span style={{
                fontSize: 11, fontWeight: 500, padding: "2px 7px",
                borderRadius: 20, background: badgeBg, color: badgeColor, marginBottom: 2,
              }}>
                {badge}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

        {/* Incidents by mode */}
        <div style={card}>
          <div style={cardHeader}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>Incidents by mode</div>
              <div style={{ fontSize: 11, opacity: 0.45, marginTop: 2 }}>30-day history</div>
            </div>
          </div>
          <div style={{ padding: "12px 16px 16px" }}>
            {/* Legend */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
              {legendItems.map(({ label, count, color }) => (
                <span key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, opacity: 0.7 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: "inline-block" }} />
                  {label} {count}
                </span>
              ))}
            </div>
            <div style={{ height: 200, position: "relative" }}>
              <canvas ref={incidentChartRef} />
            </div>
          </div>
        </div>

        {/* Response time trend */}
        <div style={card}>
          <div style={cardHeader}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>Response time trend</div>
              <div style={{ fontSize: 11, opacity: 0.45, marginTop: 2 }}>Minutes · 8-week history</div>
            </div>
          </div>
          <div style={{ padding: "12px 16px 16px" }}>
            <div style={{ height: 228, position: "relative" }}>
              <canvas ref={responseChartRef} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Algorithm Performance Log ── */}
      <div style={card}>
        <div style={cardHeader}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>Algorithm performance log</div>
            <div style={{ fontSize: 11, opacity: 0.45, marginTop: 2 }}>Last 8 Dijkstra's and MST runs</div>
          </div>
          <button
            style={{
              fontSize: 12, padding: "5px 12px", borderRadius: 6,
              background: theme.dark ? "rgba(59,109,17,0.15)" : "#EAF3DE",
              color: theme.dark ? "#97C459" : "#27500A",
              border: "none", cursor: "pointer", fontWeight: 500,
            }}
          >
            Analyse ↗
          </button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: theme.bg }}>
                {["Time", "Algorithm", "Mode", "Nodes", "Result", "Exec time", "Status"].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {algorithmLog.map((row, i) => (
                <tr
                  key={i}
                  style={{
                    borderTop: `1px solid ${theme.border}`,
                    background: i % 2 === 0 ? "transparent" : theme.bg + "55",
                  }}
                >
                  <td style={{ ...tdStyle, fontFamily: theme.fontMono, fontSize: 12, opacity: 0.6 }}>{row.time}</td>
                  <td style={tdStyle}>{row.algo}</td>
                  <td style={{ ...tdStyle, color: row.modeColor, fontWeight: 500 }}>{row.mode}</td>
                  <td style={{ ...tdStyle, fontFamily: theme.fontMono, fontSize: 12 }}>{row.nodes}</td>
                  <td style={{ ...tdStyle, fontFamily: theme.fontMono, fontSize: 12 }}>{row.result}</td>
                  <td style={{ ...tdStyle, fontFamily: theme.fontMono, fontSize: 12 }}>{row.exec}</td>
                  <td style={tdStyle}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                      background: theme.dark ? "rgba(59,109,17,0.15)" : "#EAF3DE",
                      color: theme.dark ? "#97C459" : "#27500A",
                    }}>
                      OK
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Live Node Load Table ── */}
      <div style={card}>
        <div style={cardHeader}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>Live node load</div>
          <div style={{ fontSize: 11, opacity: 0.45 }}>{criticalCount} critical · {activeEdges} active edges</div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: theme.bg }}>
                {["Node", "Label", "Load", "Status", "Blocked"].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {graph.nodes.map((node, i) => {
                const load = Math.round(node.load);
                const statusColor = load > 80 ? "#E24B4A" : load > 50 ? "#BA7517" : "#639922";
                const statusLabel = load > 80 ? "Critical" : load > 50 ? "Moderate" : "Healthy";
                return (
                  <tr
                    key={node.id}
                    style={{
                      borderTop: `1px solid ${theme.border}`,
                      background: i % 2 === 0 ? "transparent" : theme.bg + "55",
                    }}
                  >
                    <td style={{ ...tdStyle, fontFamily: theme.fontMono, fontSize: 12 }}>{node.id}</td>
                    <td style={tdStyle}>{node.label}</td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, height: 5, background: theme.border, borderRadius: 4, minWidth: 80 }}>
                          <div style={{
                            width: `${load}%`, height: "100%",
                            background: statusColor, borderRadius: 4,
                            transition: "width 0.4s ease",
                          }} />
                        </div>
                        <span style={{ minWidth: 32, textAlign: "right", fontFamily: theme.fontMono, fontSize: 11, opacity: 0.7 }}>
                          {load}%
                        </span>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        background: statusColor + "22", color: statusColor,
                        padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600,
                      }}>
                        {statusLabel}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, fontFamily: theme.fontMono, fontSize: 12 }}>
                      {node.isBlocked
                        ? <span style={{ color: "#E24B4A", fontWeight: 600 }}>Yes</span>
                        : <span style={{ opacity: 0.3 }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}