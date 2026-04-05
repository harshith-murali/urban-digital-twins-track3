"use client";
import { useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { useSubscription, PLAN_META, PLAN_ORDER } from "@/app/context/SubscriptionContext";

/**
 * Clerk UserButton with a custom "Subscription" page inside the profile modal.
 * - "See your current plan" menu item opens the plan details page
 * - Plan details page shows current plan + "Change plans" button → /pricing
 */
export default function ProfilePlanDropdown({ theme }) {
  const { plan } = useSubscription();
  const router = useRouter();
  const meta = PLAN_META[plan];

  return (
    <UserButton>
      <UserButton.UserProfilePage
        label="Subscription"
        labelIcon={<PlanDotIcon color={meta.color} />}
        url="subscription"
      >
        <SubscriptionPage plan={plan} meta={meta} router={router} />
      </UserButton.UserProfilePage>
    </UserButton>
  );
}

/** The custom page rendered inside Clerk's profile modal */
function SubscriptionPage({ plan, meta, router }) {
  const isPaid = plan !== "free";
  const nextPlan = plan !== "enterprise"
    ? PLAN_ORDER[PLAN_ORDER.indexOf(plan) + 1]
    : null;
  const nextMeta = nextPlan ? PLAN_META[nextPlan] : null;

  return (
    <div style={{ padding: "4px 0" }}>
      <h1 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 4px", color: "#111827" }}>
        Your Subscription
      </h1>
      <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 20px" }}>
        Manage your UrbanTwins subscription plan.
      </p>

      {/* Current plan card */}
      <div
        style={{
          padding: "16px 18px",
          borderRadius: 12,
          background: meta.bg,
          border: `1.5px solid ${meta.border}`,
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div
            style={{
              width: 36, height: 36, borderRadius: "50%",
              background: meta.color,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 18,
            }}
          >
            {meta.emoji}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: meta.color, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {meta.label} Plan
            </div>
            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 1 }}>
              {isPaid ? "Active subscription" : "No active subscription"}
            </div>
          </div>
        </div>

        {/* Plan-specific perks */}
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10,
        }}>
          {getPlanPerks(plan).map((perk) => (
            <span
              key={perk}
              style={{
                fontSize: 11, padding: "3px 9px", borderRadius: 20,
                background: "rgba(255,255,255,0.6)",
                border: `0.5px solid ${meta.border}`,
                color: meta.color, fontWeight: 500,
              }}
            >
              {perk}
            </span>
          ))}
        </div>
      </div>

      {/* Change plans button */}
      <button
        onClick={() => router.push("/pricing")}
        style={{
          width: "100%",
          padding: "10px 0",
          borderRadius: 8,
          background: "#111827",
          border: "none",
          color: "#fff",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#1f2937")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#111827")}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 7h8M8 4l3 3-3 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Change plans
      </button>

      {/* Info text */}
      {isPaid && (
        <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 12, lineHeight: 1.5, textAlign: "center" }}>
          Your plan resets when you sign out. Upgrade anytime from the pricing page.
        </p>
      )}
    </div>
  );
}

function getPlanPerks(plan) {
  const perks = {
    free:       ["Map view", "Traffic mode", "Disaster mode", "Basic alerts"],
    starter:    ["CSV export", "Route history", "Email support", "99.5% SLA"],
    city:       ["AI Advisor", "5 zones", "Full analytics", "Priority support"],
    enterprise: ["Unlimited zones", "White-label", "API access", "RBAC & SSO"],
  };
  return perks[plan] ?? perks.free;
}

function PlanDotIcon({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5" fill={color} opacity="0.85" />
      <circle cx="7" cy="7" r="2.5" fill="#fff" opacity="0.4" />
    </svg>
  );
}
