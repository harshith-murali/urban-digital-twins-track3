"use client";
import { useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { useSubscription, PLAN_META, PLAN_ORDER } from "@/app/context/SubscriptionContext";

/**
 * Renders Clerk's UserButton with a custom menu item showing the user's
 * subscription plan. When clicked, it navigates to the pricing page.
 * No separate dropdown — everything lives inside Clerk's built-in menu
 * alongside "Manage account" and "Sign out".
 */
export default function ProfilePlanDropdown({ theme, setPage }) {
  const { plan } = useSubscription();
  const router = useRouter();

  const meta = PLAN_META[plan];
  const isTopTier = plan === "enterprise";
  const nextPlan = !isTopTier ? PLAN_ORDER[PLAN_ORDER.indexOf(plan) + 1] : null;
  const nextMeta = nextPlan ? PLAN_META[nextPlan] : null;

  const planLabel = `${meta.emoji} ${meta.label} Plan`;
  const upgradeLabel = nextMeta
    ? `Upgrade to ${nextMeta.label}`
    : "🏆 Top tier active";

  return (
    <UserButton>
      <UserButton.MenuItems>
        {/* Current plan display */}
        <UserButton.Action
          label={planLabel}
          labelIcon={<PlanIcon color={meta.color} />}
          onClick={() => router.push("/pricing")}
        />
        {/* Upgrade CTA (or top-tier message) */}
        {nextMeta && (
          <UserButton.Action
            label={upgradeLabel}
            labelIcon={<UpgradeIcon color={nextMeta.color} />}
            onClick={() => router.push("/pricing")}
          />
        )}
      </UserButton.MenuItems>
    </UserButton>
  );
}

/** Tiny colored dot icon for the plan row */
function PlanIcon({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5" fill={color} opacity="0.9" />
      <circle cx="7" cy="7" r="3" fill="#fff" opacity="0.35" />
    </svg>
  );
}

/** Small lightning bolt icon for upgrade row */
function UpgradeIcon({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M8 1L3 8h3.5L5 13l6-7H7.5L9.5 1H8z" fill={color} opacity="0.9" />
    </svg>
  );
}
