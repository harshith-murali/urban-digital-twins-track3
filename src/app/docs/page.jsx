"use client";

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
  return (
    <div style={{
      minHeight: "100vh", padding: "60px 40px",
      background: "linear-gradient(160deg, #0a0f1a 0%, #0d1a0a 100%)",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Header */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{
          display: "inline-block", padding: "4px 14px", borderRadius: 20,
          background: "rgba(24,95,165,0.12)", border: "0.5px solid rgba(24,95,165,0.3)",
          fontSize: 11, fontWeight: 700, color: "#185FA5", letterSpacing: "0.5px",
          marginBottom: 16, textTransform: "uppercase",
        }}>
          API Reference · v1.0
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: "#fff", margin: "0 0 12px", letterSpacing: "-0.8px" }}>
          UrbanTwins API
        </h1>
        <p style={{ fontSize: 15, color: "rgba(232,234,240,0.55)", marginBottom: 40 }}>
          Integrate real-time city infrastructure data into your own systems. All endpoints are REST-based and return JSON.
        </p>

        {/* Auth note */}
        <div style={{
          background: "rgba(186,117,23,0.08)", border: "0.5px solid rgba(186,117,23,0.3)",
          borderRadius: 12, padding: "14px 18px", marginBottom: 40,
          fontSize: 13, color: "rgba(232,234,240,0.7)",
        }}>
          <span style={{ fontWeight: 700, color: "#BA7517" }}>Authentication: </span>
          Include your API key in the request header: <code style={{ background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: 4, fontFamily: "DM Mono, monospace" }}>Authorization: Bearer &lt;your_api_key&gt;</code>
        </div>

        {/* Base URL */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(232,234,240,0.4)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Base URL</div>
          <code style={{
            display: "block", background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)",
            borderRadius: 8, padding: "12px 16px", fontSize: 14, color: "#639922",
            fontFamily: "DM Mono, monospace",
          }}>
            https://api.urbantwins.io/v1
          </code>
        </div>

        {/* Endpoints */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {ENDPOINTS.map((ep) => (
            <div
              key={ep.path}
              style={{
                background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.07)",
                borderRadius: 12, overflow: "hidden",
              }}
            >
              <div style={{ padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 14, borderBottom: ep.body ? "0.5px solid rgba(255,255,255,0.05)" : "none" }}>
                <span style={{
                  flexShrink: 0, padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                  background: `${ep.color}18`, color: ep.color, fontFamily: "DM Mono, monospace",
                  letterSpacing: "0.3px",
                }}>
                  {ep.method}
                </span>
                <div>
                  <code style={{ fontSize: 14, color: "#e8eaf0", fontFamily: "DM Mono, monospace" }}>{ep.path}</code>
                  <p style={{ margin: "6px 0 0", fontSize: 13, color: "rgba(232,234,240,0.5)" }}>{ep.description}</p>
                </div>
              </div>
              {ep.body && (
                <div style={{ padding: "12px 18px", background: "rgba(0,0,0,0.2)" }}>
                  <div style={{ fontSize: 11, color: "rgba(232,234,240,0.35)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>Request Body</div>
                  <code style={{ fontSize: 13, color: "#97C459", fontFamily: "DM Mono, monospace" }}>{ep.body}</code>
                </div>
              )}
            </div>
          ))}
        </div>

        <p style={{ marginTop: 48, fontSize: 13, color: "rgba(232,234,240,0.3)", textAlign: "center" }}>
          Need help? Contact <a href="mailto:api@urbantwins.io" style={{ color: "#639922", textDecoration: "none" }}>api@urbantwins.io</a>
        </p>
      </div>
    </div>
  );
}
