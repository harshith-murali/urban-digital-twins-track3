"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";

// Plan hierarchy — index = power level
export const PLAN_ORDER = ["free", "starter", "city", "enterprise"];

export const PLAN_META = {
  free: {
    label: "Free",
    color: "#6B7280",
    bg: "rgba(107,114,128,0.12)",
    border: "rgba(107,114,128,0.25)",
    emoji: "🟢",
  },
  starter: {
    label: "Starter",
    color: "#639922",
    bg: "rgba(99,153,34,0.12)",
    border: "rgba(99,153,34,0.30)",
    emoji: "🌱",
  },
  city: {
    label: "City",
    color: "#BA7517",
    bg: "rgba(186,117,23,0.12)",
    border: "rgba(186,117,23,0.30)",
    emoji: "🏙️",
  },
  enterprise: {
    label: "Enterprise",
    color: "#185FA5",
    bg: "rgba(24,95,165,0.12)",
    border: "rgba(24,95,165,0.30)",
    emoji: "🏛️",
  },
};

/** Returns true if `plan` meets or exceeds `minPlan` */
export function planMeetsRequirement(plan, minPlan) {
  return PLAN_ORDER.indexOf(plan) >= PLAN_ORDER.indexOf(minPlan);
}

const SubscriptionContext = createContext(null);

export function SubscriptionProvider({ children }) {
  const [plan, setPlanState] = useState("free");
  const { isSignedIn } = useAuth();

  // Rehydrate from localStorage on mount (only if signed in)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("urbantwin_plan");
      if (stored && PLAN_ORDER.includes(stored)) setPlanState(stored);
    } catch {}
  }, []);

  // Reset to free when user signs out
  useEffect(() => {
    if (isSignedIn === false) {
      // User is signed out — clear their plan
      setPlanState("free");
      try { localStorage.removeItem("urbantwin_plan"); } catch {}
    }
  }, [isSignedIn]);

  const setPlan = (newPlan) => {
    const normalised = newPlan.toLowerCase();
    if (!PLAN_ORDER.includes(normalised)) return;
    setPlanState(normalised);
    try { localStorage.setItem("urbantwin_plan", normalised); } catch {}
  };

  const resetPlan = () => {
    setPlanState("free");
    try { localStorage.removeItem("urbantwin_plan"); } catch {}
  };

  return (
    <SubscriptionContext.Provider value={{ plan, setPlan, resetPlan, meta: PLAN_META[plan] }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription must be inside SubscriptionProvider");
  return ctx;
}
