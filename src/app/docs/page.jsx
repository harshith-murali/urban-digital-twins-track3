"use client";
import { useContext } from "react";
import { SharedStateContext } from "@/app/context/SharedStateContext";

const ENDPOINTS = [
  {
    method: "GET",
    path: "/api/graph",
    description: "Returns the current city graph with nodes, edges, and live load data.",
    color: "#639922",
  },
  {
    method: "GET",
    path: "/api/incidents",
    description: "Returns a list of active and recent system alerts across all infrastructure modes.",
    color: "#639922",
  },
  {
    method: "POST",
    path: "/api/route",
    description: "Runs Dijkstra's shortest-path algorithm between two node IDs. Returns the optimal route.",
    color: "#185FA5",
    body: `{ "from": "node_id", "to": "node_id", "mode": "traffic" }`,
  },
  {
    method: "POST",
    path: "/api/simulate",
    description: "Triggers a simulation event (flood, energy failure, pipe burst) on the city model.",
    color: "#185FA5",
    body: `{ "type": "flood" | "energy" | "water" }`,
  },
  {
    method: "GET",
    path: "/api/metrics/:mode",
    description: "Returns real-time metrics for a given infrastructure mode (traffic, energy, water, disaster).",
    color: "#639922",
  },
];

export default function DocsPage() {
  const ctx = useContext(SharedStateContext);
  const theme = ctx?.theme ?? { card: "#fff", bdr: "#e5e7eb", inputBg: "#f8f9fa", sub: "#6b7280", txt: "#111827", fontBody: "DM Sans, sans-serif", fontMono: "DM Mono, monospace", dark: false, bg: "#f5f6fa" };
  const { card, bdr, inputBg, sub, txt, fontBody, fontMono, dark, bg } = theme;

  const codeBg = dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
  const codeBorder = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";

  return (
    <div style={{ minHeight: "100%", padding: "48px 40px", background: bg, fontFamily: fontBody }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        {/* Header */}
        <div style={{
          display: "inline-block", padding: "3px 12px", borderRadius: 20,
          background: dark ? "rgba(24,95,165,0.12)" : "#E6F1FB",
          border: "0.5px solid rgba(24,95,165,0.3)",
          fontSize: 10, fontWeight: 700, color: "#185FA5", letterSpacing: "0.5px",
          marginBottom: 14, textTransform: "uppercase",
        }}>
          API Reference · v1.0
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: txt, margin: "0 0 10px", letterSpacing: "-0.6px" }}>
          UrbanTwins API
        </h1>
        <p style={{ fontSize: 14, color: sub, marginBottom: 36, lineHeight: 1.6 }}>
          Integrate real-time city infrastructure data into your own systems. All endpoints are REST-based and return JSON.
        </p>

        {/* Auth note */}
        <div style={{
          background: dark ? "rgba(186,117,23,0.08)" : "#FAEEDA",
          border: "0.5px solid rgba(186,117,23,0.3)",
          borderRadius: 10, padding: "12px 16px", marginBottom: 36,
          fontSize: 13, color: sub,
        }}>
          <span style={{ fontWeight: 700, color: "#BA7517" }}>Authentication: </span>
          Include your API key in the request header:{" "}
          <code style={{ background: codeBg, padding: "2px 6px", borderRadius: 4, fontFamily: fontMono, fontSize: 12 }}>
            Authorization: Bearer &lt;your_api_key&gt;
          </code>
        </div>

        {/* Base URL */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: sub, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
            Base URL
          </div>
          <code style={{
            display: "block", background: codeBg,
            border: `0.5px solid ${codeBorder}`,
            borderRadius: 8, padding: "12px 16px", fontSize: 13, color: "#639922",
            fontFamily: fontMono,
          }}>
            https://api.urbantwins.io/v1
          </code>
        </div>

        {/* Endpoints */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {ENDPOINTS.map((ep) => (
            <div
              key={ep.path}
              style={{
                background: card,
                border: `0.5px solid ${bdr}`,
                borderRadius: 10, overflow: "hidden",
              }}
            >
              <div style={{
                padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: 12,
                borderBottom: ep.body ? `0.5px solid ${bdr}` : "none",
              }}>
                <span style={{
                  flexShrink: 0, padding: "2px 7px", borderRadius: 5, fontSize: 10, fontWeight: 700,
                  background: dark ? `${ep.color}20` : `${ep.color}15`,
                  color: ep.color, fontFamily: fontMono, letterSpacing: "0.3px",
                }}>
                  {ep.method}
                </span>
                <div>
                  <code style={{ fontSize: 13, color: txt, fontFamily: fontMono }}>{ep.path}</code>
                  <p style={{ margin: "5px 0 0", fontSize: 12, color: sub, lineHeight: 1.5 }}>{ep.description}</p>
                </div>
              </div>
              {ep.body && (
                <div style={{ padding: "10px 16px", background: inputBg }}>
                  <div style={{ fontSize: 10, color: sub, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Request Body
                  </div>
                  <code style={{ fontSize: 12, color: "#639922", fontFamily: fontMono }}>{ep.body}</code>
                </div>
              )}
            </div>
          ))}
        </div>

        <p style={{ marginTop: 44, fontSize: 12, color: sub, textAlign: "center" }}>
          Need help? Contact{" "}
          <a href="mailto:api@urbantwins.io" style={{ color: "#639922", textDecoration: "none" }}>
            api@urbantwins.io
          </a>
        </p>
      </div>
    </div>
  );
}
