"use client";
import { useContext, useState } from "react";
import { SharedStateContext } from "@/app/context/SharedStateContext";
import { useSubscription, PLAN_META } from "@/app/context/SubscriptionContext";

const TIERS = [
  {
    name: "Starter",
    price: "₹4,999",
    amount: 4999,
    period: "/month",
    description: "For small municipalities or pilot programs",
    color: "#639922",
    features: [
      "1 city zone",
      "Traffic & disaster modes",
      "Real-time map view",
      "Basic alerting",
      "Email support",
      "99.5% SLA",
      "Export Reports (CSV)",
      "Route history & audit log",
    ],
    exclusive: ["Export Reports (CSV)", "Route history & audit log"],
    cta: "Start free trial",
    badge: null,
  },
  {
    name: "City",
    price: "₹9,999",
    amount: 9999,
    period: "/month",
    description: "For mid-size cities managing multiple zones",
    color: "#BA7517",
    features: [
      "Up to 5 city zones",
      "All 4 infrastructure modes",
      "AI advisor (Gemini)",
      "Custom alert thresholds",
      "Route history & audit log",
      "Full analytics dashboard",
      "Priority support",
      "99.8% SLA",
    ],
    exclusive: ["AI advisor (Gemini)", "Full analytics dashboard"],
    cta: "Book a demo",
    badge: "Most popular",
  },
  {
    name: "Enterprise",
    price: "₹19,999+",
    amount: 19999,
    period: "/month",
    description: "For large metro areas and government bodies",
    color: "#185FA5",
    features: [
      "Unlimited zones",
      "All City features",
      "White-label branding",
      "API access & webhooks",
      "RBAC & SSO",
      "Dedicated account manager",
      "99.99% SLA",
      "On-premise option",
    ],
    exclusive: ["White-label branding", "API access & webhooks", "RBAC & SSO", "On-premise option"],
    cta: "Contact sales",
    badge: null,
  },
];

const VALUE_PROPS = [
  {
    icon: "⏱️",
    stat: "68%",
    label: "Faster incident response",
    detail:
      "Cities using UrbanTwins resolve infrastructure emergencies 68% faster than those relying on manual monitoring & radio dispatch.",
    color: "#639922",
  },
  {
    icon: "💰",
    stat: "₹2.1 Cr",
    label: "Avg annual savings",
    detail:
      "Proactive route management and predictive maintenance prevent costly emergency repairs — averaging ₹2.1 crore saved per city per year.",
    color: "#BA7517",
  },
  {
    icon: "🔒",
    stat: "99.99%",
    label: "Enterprise SLA guarantee",
    detail:
      "Government-grade uptime backed by a written SLA. Downtime means compensation — we put our money where our mouth is.",
    color: "#185FA5",
  },
  {
    icon: "🧠",
    stat: "3× faster",
    label: "AI-powered decisions",
    detail:
      "Gemini-powered AI advisor analyses real-time sensor data and gives actionable recommendations in seconds, not hours.",
    color: "#8B5CF6",
  },
];

const COMPARISONS = [
  { feature: "Real-time multi-layer monitoring", urbantwin: true, legacy: false, manual: false },
  { feature: "AI infrastructure advisor", urbantwin: true, legacy: false, manual: false },
  { feature: "Dijkstra's route optimisation", urbantwin: true, legacy: false, manual: false },
  { feature: "Disaster mode & flood alerts", urbantwin: true, legacy: "Partial", manual: false },
  { feature: "One-click CSV export", urbantwin: true, legacy: true, manual: false },
  { feature: "99.99% uptime SLA", urbantwin: true, legacy: false, manual: false },
  { feature: "Monthly cost (city-scale)", urbantwin: "₹9,999", legacy: "₹2L+", manual: "₹5L+" },
];

export default function PricingPage() {
  const ctx = useContext(SharedStateContext);
  const theme = ctx?.theme ?? {
    card: "#fff", bdr: "#e5e7eb", inputBg: "#f8f9fa", sub: "#6b7280",
    txt: "#111827", fontBody: "DM Sans, sans-serif", fontMono: "DM Mono, monospace",
    dark: false, bg: "#f5f6fa",
  };
  const { card, bdr, inputBg, sub, txt, fontBody, fontMono, dark, bg } = theme;

  const { plan: activePlan, setPlan } = useSubscription();
  const [activated, setActivated] = useState(null);

  const handleActivate = (tier) => {
    const tierKey = tier.name.toLowerCase();
    if (activePlan === tierKey) return;
    setPlan(tierKey);
    setActivated(tier.name);
  };

  const cellStyle = (val) => {
    if (val === true)  return { text: "✓", color: "#639922", fw: 700 };
    if (val === false) return { text: "✗", color: "#E24B4A", fw: 400 };
    return { text: val, color: txt, fw: 500 };
  };

  return (
    <div style={{ minHeight: "100%", padding: "48px 40px", background: bg, fontFamily: fontBody }}>
      {/* ── Header ── */}
      <div style={{ textAlign: "center", marginBottom: 52 }}>
        <div style={{
          display: "inline-block", padding: "3px 12px", borderRadius: 20,
          background: dark ? "rgba(99,153,34,0.12)" : "#EAF3DE",
          border: "0.5px solid rgba(99,153,34,0.3)",
          fontSize: 10, fontWeight: 700, color: "#639922", letterSpacing: "0.5px",
          marginBottom: 14, textTransform: "uppercase",
        }}>
          Transparent Pricing
        </div>
        <h1 style={{ fontSize: 34, fontWeight: 800, color: txt, margin: "0 0 12px", letterSpacing: "-0.8px" }}>
          Simple, scalable plans
        </h1>
        <p style={{ fontSize: 14, color: sub, maxWidth: 440, margin: "0 auto" }}>
          Trusted by city governments across India. Start small, scale as your infrastructure grows.
        </p>
      </div>

      {/* ── Tier Cards ── */}
      <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap", maxWidth: 1000, margin: "0 auto" }}>
        {TIERS.map((tier) => {
          const tierKey   = tier.name.toLowerCase();
          const isActive  = activePlan === tierKey;
          const justActivated = activated === tier.name;

          return (
            <div
              key={tier.name}
              style={{
                background: card,
                border: `0.5px solid ${isActive ? tier.color + "88" : tier.badge ? tier.color + "55" : bdr}`,
                borderRadius: 18,
                padding: "28px 24px",
                width: 280,
                position: "relative",
                boxShadow: isActive
                  ? `0 16px 48px ${tier.color}28`
                  : tier.badge ? `0 16px 48px ${tier.color}18` : "none",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
            >
              {/* Active plan ribbon */}
              {isActive && (
                <div style={{
                  position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)",
                  background: tier.color, color: "#fff", fontSize: 10, fontWeight: 700,
                  padding: "2px 12px", borderRadius: 20, letterSpacing: "0.5px",
                  textTransform: "uppercase", whiteSpace: "nowrap",
                }}>
                  ✓ Your current plan
                </div>
              )}

              {!isActive && tier.badge && (
                <div style={{
                  position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)",
                  background: tier.color, color: "#fff", fontSize: 10, fontWeight: 700,
                  padding: "2px 12px", borderRadius: 20, letterSpacing: "0.5px",
                  textTransform: "uppercase", whiteSpace: "nowrap",
                }}>
                  {tier.badge}
                </div>
              )}

              <div style={{ borderBottom: `0.5px solid ${bdr}`, paddingBottom: 18, marginBottom: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: tier.color, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                  {tier.name}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 6 }}>
                  <span style={{ fontSize: 32, fontWeight: 800, color: txt, fontFamily: fontMono }}>{tier.price}</span>
                  <span style={{ fontSize: 12, color: sub }}>{tier.period}</span>
                </div>
                <p style={{ fontSize: 12, color: sub, margin: 0, lineHeight: 1.5 }}>{tier.description}</p>
              </div>

              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 8 }}>
                {tier.features.map((f) => {
                  const isExclusive = tier.exclusive?.includes(f);
                  return (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: isExclusive ? txt : sub }}>
                      <span style={{
                        width: 15, height: 15, borderRadius: "50%",
                        background: dark ? `${tier.color}22` : `${tier.color}15`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 8, color: tier.color, flexShrink: 0, fontWeight: 700,
                      }}>✓</span>
                      {f}
                      {isExclusive && (
                        <span style={{
                          marginLeft: "auto", fontSize: 9, fontWeight: 700, padding: "1px 6px",
                          borderRadius: 10, background: `${tier.color}18`, color: tier.color,
                          textTransform: "uppercase", letterSpacing: "0.3px",
                        }}>NEW</span>
                      )}
                    </li>
                  );
                })}
              </ul>

              <button
                onClick={() => handleActivate(tier)}
                disabled={isActive}
                style={{
                  display: "block", width: "100%", textAlign: "center",
                  padding: "11px 0", borderRadius: 9,
                  cursor: isActive ? "default" : "pointer",
                  background: isActive
                    ? (dark ? "rgba(99,153,34,0.18)" : "#EAF3DE")
                    : tier.badge ? tier.color : inputBg,
                  border: `0.5px solid ${isActive ? "#639922" : tier.badge ? "transparent" : bdr}`,
                  color: isActive ? "#639922" : tier.badge ? "#fff" : sub,
                  fontSize: 12, fontWeight: 600, fontFamily: fontBody,
                  transition: "all 0.15s",
                }}
              >
                {isActive ? "✓ Active Plan" : tier.cta}
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Note ── */}
      <div style={{ textAlign: "center", marginTop: 44, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
        <p style={{ fontSize: 12, color: sub, margin: 0 }}>
          All plans include a 14-day free trial · Instant activation · Cancel anytime
        </p>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "4px 12px", borderRadius: 20,
          background: dark ? "rgba(255,255,255,0.04)" : "#f8f9fa",
          border: `0.5px solid ${bdr}`,
          fontSize: 11, color: sub,
        }}>
          <span>🔒</span> Secure platform · Enterprise-grade infrastructure
        </div>
      </div>

      {/* ════════════════════════════════════
          WHY PAYING IS A GOOD DEAL SECTION
      ════════════════════════════════════ */}
      <div style={{ maxWidth: 1000, margin: "80px auto 0" }}>

        {/* Section header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{
            display: "inline-block", padding: "3px 12px", borderRadius: 20,
            background: dark ? "rgba(186,117,23,0.12)" : "#FEF3E2",
            border: "0.5px solid rgba(186,117,23,0.3)",
            fontSize: 10, fontWeight: 700, color: "#BA7517", letterSpacing: "0.5px",
            marginBottom: 14, textTransform: "uppercase",
          }}>
            Return on Investment
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: txt, margin: "0 0 12px", letterSpacing: "-0.6px" }}>
            Why UrbanTwins pays for itself
          </h2>
          <p style={{ fontSize: 14, color: sub, maxWidth: 520, margin: "0 auto", lineHeight: 1.65 }}>
            Managing city infrastructure manually is expensive, slow, and error-prone. UrbanTwins
            replaces a room full of operators and legacy GIS tools — at a fraction of the cost.
          </p>
        </div>

        {/* Value prop cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 16, marginBottom: 52 }}>
          {VALUE_PROPS.map((v) => (
            <div
              key={v.label}
              style={{
                background: card,
                border: `0.5px solid ${bdr}`,
                borderRadius: 14,
                padding: "20px 18px",
                borderTop: `3px solid ${v.color}`,
                transition: "box-shadow 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `0 8px 24px ${v.color}18`)}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
            >
              <div style={{ fontSize: 26, marginBottom: 10 }}>{v.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: v.color, fontFamily: fontMono, letterSpacing: "-0.5px" }}>
                {v.stat}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: txt, margin: "4px 0 8px" }}>
                {v.label}
              </div>
              <p style={{ fontSize: 12, color: sub, margin: 0, lineHeight: 1.6 }}>
                {v.detail}
              </p>
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <div style={{ background: card, border: `0.5px solid ${bdr}`, borderRadius: 16, overflow: "hidden", marginBottom: 52 }}>
          <div style={{ padding: "16px 20px", borderBottom: `0.5px solid ${bdr}`, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16 }}>📊</span>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: txt, margin: 0 }}>Feature comparison</p>
              <p style={{ fontSize: 11, color: sub, margin: 0, marginTop: 2 }}>UrbanTwins vs legacy GIS vs manual operations</p>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `0.5px solid ${bdr}` }}>
                  <th style={{ textAlign: "left", padding: "10px 20px", color: sub, fontWeight: 500, width: "50%" }}>Feature</th>
                  <th style={{ textAlign: "center", padding: "10px 16px", color: "#639922", fontWeight: 700 }}>UrbanTwins</th>
                  <th style={{ textAlign: "center", padding: "10px 16px", color: sub, fontWeight: 500 }}>Legacy GIS</th>
                  <th style={{ textAlign: "center", padding: "10px 16px", color: sub, fontWeight: 500 }}>Manual Ops</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISONS.map((row, i) => {
                  const ut  = cellStyle(row.urbantwin);
                  const leg = cellStyle(row.legacy);
                  const man = cellStyle(row.manual);
                  return (
                    <tr
                      key={row.feature}
                      style={{
                        borderBottom: i < COMPARISONS.length - 1 ? `0.5px solid ${bdr}` : "none",
                        background: i % 2 === 0 ? "transparent" : (dark ? "rgba(255,255,255,0.015)" : "rgba(0,0,0,0.015)"),
                      }}
                    >
                      <td style={{ padding: "10px 20px", color: sub }}>{row.feature}</td>
                      <td style={{ textAlign: "center", padding: "10px 16px", color: ut.color, fontWeight: ut.fw, fontFamily: fontMono }}>
                        {ut.text}
                      </td>
                      <td style={{ textAlign: "center", padding: "10px 16px", color: leg.color, fontWeight: leg.fw, fontFamily: fontMono }}>
                        {leg.text}
                      </td>
                      <td style={{ textAlign: "center", padding: "10px 16px", color: man.color, fontWeight: man.fw, fontFamily: fontMono }}>
                        {man.text}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trust badges */}
        <div style={{
          background: dark ? "rgba(99,153,34,0.05)" : "#F8FCF3",
          border: "0.5px solid rgba(99,153,34,0.2)",
          borderRadius: 14,
          padding: "24px 28px",
          marginBottom: 20,
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: txt, margin: "0 0 18px", textAlign: "center" }}>
            Built for government-grade reliability
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            {[
              { icon: "🏛️", label: "Government-grade" },
              { icon: "🔐", label: "RBAC & SSO" },
              { icon: "🛡️", label: "Data sovereignty" },
              { icon: "📡", label: "Real-time telemetry" },
              { icon: "🤖", label: "Gemini AI-powered" },
              { icon: "📊", label: "Full audit trail" },
              { icon: "⚡", label: "Sub-second alerts" },
              { icon: "🗺️", label: "Leaflet maps" },
            ].map((b) => (
              <div
                key={b.label}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "5px 12px", borderRadius: 20,
                  background: dark ? "rgba(255,255,255,0.05)" : "#fff",
                  border: `0.5px solid ${bdr}`,
                  fontSize: 11, color: sub,
                }}
              >
                <span>{b.icon}</span>
                <span style={{ fontWeight: 500, color: txt }}>{b.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div style={{ textAlign: "center", padding: "32px 20px" }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: txt, margin: "0 0 8px" }}>
            Still on the fence? Start completely free.
          </p>
          <p style={{ fontSize: 13, color: sub, margin: "0 0 20px", lineHeight: 1.5 }}>
            No credit card. No commitment. Upgrade when you see the value — and you will.
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            style={{
              padding: "12px 32px", borderRadius: 10, fontSize: 13, fontWeight: 700,
              background: "#639922", color: "#fff", border: "none", cursor: "pointer",
              fontFamily: fontBody, letterSpacing: "0.2px",
              boxShadow: "0 8px 24px rgba(99,153,34,0.28)",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 12px 32px rgba(99,153,34,0.35)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(99,153,34,0.28)";
            }}
          >
            Choose a plan ↑
          </button>
        </div>
      </div>
    </div>
  );
}