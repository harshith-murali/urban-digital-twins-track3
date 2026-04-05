"use client";
import { useContext } from "react";
import { SharedStateContext } from "@/app/context/SharedStateContext";

const TIERS = [
  {
    name: "Starter",
    price: "₹4,999",
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
    ],
    cta: "Start free trial",
    badge: null,
  },
  {
    name: "City",
    price: "₹9,999",
    period: "/month",
    description: "For mid-size cities managing multiple zones",
    color: "#BA7517",
    features: [
      "Up to 5 city zones",
      "All 4 infrastructure modes",
      "AI advisor (Gemini)",
      "Custom alert thresholds",
      "Route history & audit log",
      "Priority support",
      "99.8% SLA",
    ],
    cta: "Book a demo",
    badge: "Most popular",
  },
  {
    name: "Enterprise",
    price: "₹19,999+",
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
    cta: "Contact sales",
    badge: null,
  },
];

export default function PricingPage() {
  const ctx = useContext(SharedStateContext);
  const theme = ctx?.theme ?? { card: "#fff", bdr: "#e5e7eb", inputBg: "#f8f9fa", sub: "#6b7280", txt: "#111827", fontBody: "DM Sans, sans-serif", fontMono: "DM Mono, monospace", dark: false, bg: "#f5f6fa" };
  const { card, bdr, inputBg, sub, txt, fontBody, fontMono, dark, bg } = theme;

  return (
    <div style={{ minHeight: "100%", padding: "48px 40px", background: bg, fontFamily: fontBody }}>
      {/* Header */}
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

      {/* Tier cards */}
      <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap", maxWidth: 1000, margin: "0 auto" }}>
        {TIERS.map((tier) => (
          <div
            key={tier.name}
            style={{
              background: card,
              border: `0.5px solid ${tier.badge ? tier.color + "55" : bdr}`,
              borderRadius: 18,
              padding: "28px 24px",
              width: 280,
              position: "relative",
              boxShadow: tier.badge ? `0 16px 48px ${tier.color}18` : "none",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
          >
            {tier.badge && (
              <div style={{
                position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)",
                background: tier.color, color: "#fff", fontSize: 10, fontWeight: 700,
                padding: "2px 12px", borderRadius: 20, letterSpacing: "0.5px", textTransform: "uppercase",
                whiteSpace: "nowrap",
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
              {tier.features.map((f) => (
                <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: sub }}>
                  <span style={{
                    width: 15, height: 15, borderRadius: "50%",
                    background: dark ? `${tier.color}22` : `${tier.color}15`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 8, color: tier.color, flexShrink: 0, fontWeight: 700,
                  }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <a
              href="/sign-up"
              style={{
                display: "block", textAlign: "center", padding: "10px 0", borderRadius: 9,
                background: tier.badge ? tier.color : inputBg,
                border: `0.5px solid ${tier.badge ? "transparent" : bdr}`,
                color: tier.badge ? "#fff" : sub,
                fontSize: 12, fontWeight: 600, textDecoration: "none",
                transition: "all 0.15s", fontFamily: fontBody,
              }}
            >
              {tier.cta}
            </a>
          </div>
        ))}
      </div>

      <p style={{ textAlign: "center", marginTop: 44, fontSize: 12, color: sub }}>
        All plans include a 14-day free trial · No credit card required · Cancel anytime · GST extra
      </p>
    </div>
  );
}
