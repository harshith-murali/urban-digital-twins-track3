import { Activity, Zap, Droplets, AlertTriangle } from "lucide-react";

export const MODES = [
  {
    id: "traffic",
    label: "Traffic",
    icon: Activity,
    accent: "#3B6D11",
    accentBg: "rgba(59,109,17,0.10)",
    accentBorder: "rgba(59,109,17,0.25)",
    sourceCanBeBlocked: false,
    destCanBeBlocked: false,
  },
  {
    id: "energy",
    label: "Energy",
    icon: Zap,
    accent: "#BA7517",
    accentBg: "rgba(186,117,23,0.10)",
    accentBorder: "rgba(186,117,23,0.25)",
    sourceCanBeBlocked: false,
    destCanBeBlocked: true,
  },
  {
    id: "water",
    label: "Water",
    icon: Droplets,
    accent: "#185FA5",
    accentBg: "rgba(24,95,165,0.10)",
    accentBorder: "rgba(24,95,165,0.25)",
    sourceCanBeBlocked: false,
    destCanBeBlocked: false,
  },
  {
    id: "disaster",
    label: "Disaster",
    icon: AlertTriangle,
    accent: "#A32D2D",
    accentBg: "rgba(163,45,45,0.10)",
    accentBorder: "rgba(163,45,45,0.25)",
    sourceCanBeBlocked: true,
    destCanBeBlocked: false,
  },
];

export const PAGES = ["overview", "traffic", "energy", "water", "disaster", "analytics", "pricing", "docs"];