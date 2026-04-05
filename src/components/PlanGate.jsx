"use client";
import { useRouter } from "next/navigation";
import { useSubscription, planMeetsRequirement, PLAN_META } from "@/app/context/SubscriptionContext";
import { Lock } from "lucide-react";

/**
 * PlanGate — renders children if user meets `minPlan`.
 * Otherwise blurs children and shows an upgrade overlay.
 *
 * Props:
 *   minPlan  - "starter" | "city" | "enterprise"
 *   theme    - theme tokens
 *   compact  - if true, renders a small tooltip-style gate (good for buttons)
 *   label    - custom lock message
 *
 * Usage:
 *   <PlanGate minPlan="starter" theme={theme}>
 *     <SomePremiumFeature />
 *   </PlanGate>
 */
export default function PlanGate({ minPlan = "starter", theme, children, label, compact = false }) {
  const { plan } = useSubscription();
  const router = useRouter();
  const hasAccess = planMeetsRequirement(plan, minPlan);

  if (hasAccess) return <>{children}</>;

  const { sub, txt, fontBody, dark, bdr, inputBg } = theme ?? {};
  const requiredMeta = PLAN_META[minPlan];

  // ── Compact mode: inline pill gate for small elements (buttons, etc.) ─────
  if (compact) {
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 10px",
          borderRadius: 8,
          background: dark ? "rgba(255,255,255,0.04)" : inputBg,
          border: `0.5px solid ${bdr}`,
          cursor: "pointer",
          transition: "opacity 0.15s",
        }}
        onClick={() => router.push("/pricing")}
        title={`${requiredMeta.label} plan required. Click to upgrade.`}
      >
        <Lock size={11} color={requiredMeta.color} />
        <span style={{ fontSize: 11, color: sub, fontFamily: fontBody }}>
          {label ?? `${requiredMeta.label} required`}
        </span>
      </div>
    );
  }

  // ── Full mode: blurred children + centered overlay ───────────────────────
  return (
    <div style={{ position: "relative" }}>
      {/* Blurred preview */}
      <div
        style={{
          filter: "blur(3px)",
          pointerEvents: "none",
          userSelect: "none",
          opacity: 0.4,
        }}
      >
        {children}
      </div>

      {/* Lock overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          borderRadius: 10,
          backdropFilter: "blur(2px)",
          background: dark
            ? "rgba(13,15,20,0.75)"
            : "rgba(244,246,250,0.82)",
          border: `1px solid ${requiredMeta.border}`,
          zIndex: 10,
          textAlign: "center",
          padding: "16px 20px",
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: requiredMeta.bg,
            border: `1px solid ${requiredMeta.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Lock size={14} color={requiredMeta.color} />
        </div>

        <div>
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: txt ?? "#111827",
              margin: "0 0 3px",
              fontFamily: fontBody,
            }}
          >
            {label ?? `${requiredMeta.label} plan required`}
          </p>
          <p
            style={{
              fontSize: 11,
              color: sub ?? "#6B7280",
              margin: 0,
              lineHeight: 1.5,
              fontFamily: fontBody,
            }}
          >
            Upgrade to unlock this feature.
          </p>
        </div>

        <button
          onClick={() => router.push("/pricing")}
          style={{
            padding: "6px 16px",
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 600,
            fontFamily: fontBody,
            cursor: "pointer",
            background: requiredMeta.color,
            color: "#fff",
            border: "none",
            transition: "opacity 0.15s",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Upgrade to {requiredMeta.label} →
        </button>
      </div>
    </div>
  );
}
