"use client";

const TIERS = [
  {
    name: "Starter",
    price: "$499",
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
    price: "$1,999",
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
    price: "Custom",
    period: "",
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
  return (
    <div style={{
      minHeight: "100vh", padding: "60px 40px",
      background: "linear-gradient(160deg, #0a0f1a 0%, #0d1a0a 100%)",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 60 }}>
        <div style={{
          display: "inline-block", padding: "4px 14px", borderRadius: 20,
          background: "rgba(99,153,34,0.12)", border: "0.5px solid rgba(99,153,34,0.3)",
          fontSize: 11, fontWeight: 700, color: "#639922", letterSpacing: "0.5px",
          marginBottom: 16, textTransform: "uppercase",
        }}>
          Transparent Pricing
        </div>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: "#fff", margin: "0 0 16px", letterSpacing: "-1px" }}>
          Simple, scalable plans
        </h1>
        <p style={{ fontSize: 16, color: "rgba(232,234,240,0.55)", maxWidth: 480, margin: "0 auto" }}>
          Trusted by city governments across South Asia. Start small, scale as your infrastructure grows.
        </p>
      </div>

      {/* Tier cards */}
      <div style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap", maxWidth: 1000, margin: "0 auto" }}>
        {TIERS.map((tier) => (
          <div
            key={tier.name}
            style={{
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${tier.badge ? tier.color + "50" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 20,
              padding: "32px 28px",
              width: 280,
              position: "relative",
              boxShadow: tier.badge ? `0 20px 60px ${tier.color}18` : "none",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
          >
            {tier.badge && (
              <div style={{
                position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                background: tier.color, color: "#fff", fontSize: 10, fontWeight: 700,
                padding: "3px 12px", borderRadius: 20, letterSpacing: "0.5px", textTransform: "uppercase",
              }}>
                {tier.badge}
              </div>
            )}
            <div style={{ borderBottom: "0.5px solid rgba(255,255,255,0.07)", paddingBottom: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: tier.color, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                {tier.name}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: "#fff" }}>{tier.price}</span>
                <span style={{ fontSize: 13, color: "rgba(232,234,240,0.45)" }}>{tier.period}</span>
              </div>
              <p style={{ fontSize: 13, color: "rgba(232,234,240,0.5)", margin: 0 }}>{tier.description}</p>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 10 }}>
              {tier.features.map((f) => (
                <li key={f} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: "rgba(232,234,240,0.75)" }}>
                  <span style={{ width: 16, height: 16, borderRadius: "50%", background: `${tier.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: tier.color, flexShrink: 0, fontWeight: 700 }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <a
              href="/sign-up"
              style={{
                display: "block", textAlign: "center", padding: "11px 0", borderRadius: 10,
                background: tier.badge ? tier.color : "rgba(255,255,255,0.05)",
                border: `1px solid ${tier.badge ? "transparent" : "rgba(255,255,255,0.1)"}`,
                color: tier.badge ? "#fff" : "rgba(232,234,240,0.7)",
                fontSize: 13, fontWeight: 600, textDecoration: "none",
                transition: "all 0.15s",
              }}
            >
              {tier.cta}
            </a>
          </div>
        ))}
      </div>

      {/* Enterprise note */}
      <p style={{ textAlign: "center", marginTop: 48, fontSize: 13, color: "rgba(232,234,240,0.35)" }}>
        All plans include a 14-day free trial · No credit card required · Cancel anytime
      </p>
    </div>
  );
}
