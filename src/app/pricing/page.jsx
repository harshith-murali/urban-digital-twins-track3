"use client";
import { useContext, useState } from "react";
import { SharedStateContext } from "@/app/context/SharedStateContext";
import { useSubscription } from "@/app/context/SubscriptionContext";

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

  return (
    <div style={{ minHeight: "100%", padding: "48px 40px", background: bg, fontFamily: fontBody }}>
      
      <div style={{ textAlign: "center", marginBottom: 52 }}>
        <h1 style={{ fontSize: 34, fontWeight: 800, color: txt }}>Simple, scalable plans</h1>
        <p style={{ fontSize: 14, color: sub }}>Start small, scale as your infrastructure grows.</p>
      </div>

      <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
        {TIERS.map((tier) => {
          const tierKey = tier.name.toLowerCase();
          const isActive = activePlan === tierKey;

          return (
            <div
              key={tier.name}
              style={{
                background: card,
                border: `1px solid ${bdr}`,
                borderRadius: 16,
                padding: 24,
                width: 280,
              }}
            >
              <h3 style={{ color: tier.color }}>{tier.name}</h3>
              <h2 style={{ color: txt }}>{tier.price}</h2>
              <p style={{ color: sub }}>{tier.description}</p>

              <ul style={{ padding: 0, listStyle: "none" }}>
                {tier.features.map((f) => (
                  <li key={f} style={{ fontSize: 12, marginBottom: 6 }}>{f}</li>
                ))}
              </ul>

              <button
                onClick={() => handleActivate(tier)}
                disabled={isActive}
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 8,
                  background: isActive ? "#EAF3DE" : tier.color,
                  color: isActive ? "#639922" : "#fff",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {isActive ? "Active Plan" : tier.cta}
              </button>
            </div>
          );
        })}
      </div>

    </div>
  );
}