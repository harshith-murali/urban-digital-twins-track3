"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { cloneGraph } from "@/lib/graphUtils";
import { cityGraph } from "@/data/cityGraph";
import { MODES } from "@/app/constants/modes";
import { useAlerts } from "@/app/hooks/useAlerts";
import { useRouting } from "@/app/hooks/useRouting";
import { useEnergyMode } from "@/app/hooks/useEnergyMode";
import { useWaterMode } from "@/app/hooks/useWaterMode";
import { useDisasterMode } from "@/app/hooks/useDisasterMode";

export const SharedStateContext = createContext(null);
export const useSharedState = () => useContext(SharedStateContext);

export function SharedStateProvider({ children }) {
  const [mode, setMode]   = useState("traffic");
  const [graph, setGraph] = useState(cloneGraph(cityGraph));
  const [theme, setTheme] = useState("dark");
  const [dark,  setDark]  = useState(true);

  const currentMode = MODES.find((m) => m.id === mode) ?? MODES[0];
  const accent      = currentMode.accent;

  // ── Core shared hooks ──────────────────────────────────────────────────────
  const { alerts, addAlert, clearModeAlerts } = useAlerts(graph, mode);

  const routing = useRouting(graph, currentMode);

  // ── Domain slices ──────────────────────────────────────────────────────────
  const energy = useEnergyMode({
    mode,
    setGraph,
    clearPath: routing.clearPath,
    addAlert,
    clearModeAlerts,
  });

  const water = useWaterMode({
    mode,
    addAlert,
    clearModeAlerts,
  });

  const disaster = useDisasterMode({
    setGraph,
    clearPath: routing.clearPath,
    addAlert,
    clearModeAlerts,
  });

  // ── Reset graph + path whenever mode changes ───────────────────────────────
  useEffect(() => {
    setGraph(cloneGraph(cityGraph));
    routing.clearPath();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const blockedCount  = graph.nodes.filter((n) => n.isBlocked).length;
  const avgLoad       = Math.round(
    graph.nodes.reduce((s, n) => s + (n.load ?? 0), 0) / (graph.nodes.length || 1)
  );
  const criticalCount = alerts.filter((a) => a.load > 90).length;

  // ── Theme tokens ───────────────────────────────────────────────────────────
  const themeTokens = dark
    ? {
        dark:     true,
        bg:       "#0D0F14",
        card:     "#13161E",
        bdr:      "#1F2433",
        inputBg:  "#1A1E2A",
        txt:      "#E8EAF0",
        sub:      "#6B7280",
        fontBody: "'Inter', sans-serif",
        fontMono: "'JetBrains Mono', monospace",
      }
    : {
        dark:     false,
        bg:       "#F4F6FA",
        card:     "#FFFFFF",
        bdr:      "#E2E6EF",
        inputBg:  "#F0F2F8",
        txt:      "#0F1117",
        sub:      "#6B7280",
        fontBody: "'Inter', sans-serif",
        fontMono: "'JetBrains Mono', monospace",
      };

  const value = {
    // mode
    mode, setMode,
    currentMode,
    accent,

    // graph
    graph, setGraph,

    // theme
    theme: themeTokens,
    darkMode: dark,
    toggleDark: () => setDark((d) => !d),

    // alerts
    alerts,
    addAlert,
    clearModeAlerts,
    criticalCount,

    // derived
    avgLoad,
    blockedCount,

    // slices — kept nested so buildPageProps can destructure them
    routing,
    energy,
    water,
    disaster,
  };

  return (
    <SharedStateContext.Provider value={value}>
      {children}
    </SharedStateContext.Provider>
  );
}