"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Zap, Droplets, AlertTriangle, History, GitBranch, FileText, Settings, Search } from "lucide-react";
import { MODES } from "../app/constants/modes.js";

/**
 * Slide-in navigation drawer.
 * Shows system links, tool links, and per-system health bars.
 */
export default function Drawer({
  theme,
  open,
  page, setPage,
  mode, setMode,
  alerts, criticalCount,
  failedStation, burstActive, floodActive,
  healthData,
  onClose,
}) {
  const { sideBg, bdr, sub, txt, inputBg, fontBody, fontMono } = theme;

  const DRAWER_ITEMS = [
    {
      section: "Systems",
      items: [
        { id: "traffic",  label: "Traffic",  icon: Activity,      badge: criticalCount > 0 ? "LIVE" : null, badgeType: "red"   },
        { id: "energy",   label: "Energy",   icon: Zap,           badge: failedStation ? "WARN" : null,     badgeType: "amber" },
        { id: "water",    label: "Water",    icon: Droplets,      badge: burstActive ? "ALERT" : null,      badgeType: "red"   },
        { id: "disaster", label: "Disaster", icon: AlertTriangle, badge: floodActive ? "ACT" : null,        badgeType: "red"   },
      ],
    },
    {
      section: "Tools",
      items: [
        { id: "history",   label: "Route History", icon: History  },
        { id: "citygraph", label: "City Graph",    icon: GitBranch },
        {
          id: "logs", label: "Alert Logs", icon: FileText,
          badge: alerts.length > 0 ? String(alerts.length > 9 ? "9+" : alerts.length) : null,
          badgeType: "red",
        },
      ],
    },
    {
      section: "Settings",
      items: [
        { id: "prefs",  label: "Preferences", icon: Settings },
        { id: "search", label: "Search",       icon: Search   },
      ],
    },
  ];

  const handleItemClick = (id) => {
    if (MODES.find((m) => m.id === id)) { setMode(id); setPage(id); }
    else setPage(id);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.nav
          id="drawer"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 200, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          style={{
            background: sideBg, borderRight: `0.5px solid ${bdr}`,
            overflow: "hidden", flexShrink: 0, zIndex: 10,
          }}
        >
          <div
            style={{
              width: 200, padding: "12px 8px",
              display: "flex", flexDirection: "column", gap: 2,
              height: "100%", overflowY: "auto",
            }}
          >
            {DRAWER_ITEMS.map(({ section, items }) => (
              <div key={section}>
                <div
                  style={{
                    fontSize: 10, fontWeight: 500, color: sub,
                    textTransform: "uppercase", letterSpacing: ".7px",
                    padding: "8px 10px 4px",
                  }}
                >
                  {section}
                </div>
                {items.map(({ id, label, icon: Icon, badge, badgeType }) => {
                  const isActive = page === id || mode === id;
                  return (
                    <button
                      key={id}
                      onClick={() => handleItemClick(id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "7px 10px", borderRadius: 6, fontSize: 12,
                        color: isActive ? (theme.dark ? "#97C459" : "#27500A") : sub,
                        cursor: "pointer", border: "none", width: "100%",
                        textAlign: "left", fontFamily: fontBody,
                        transition: "all .12s", position: "relative",
                        background: isActive ? (theme.dark ? "rgba(59,109,17,0.15)" : "#EAF3DE") : "transparent",
                        fontWeight: isActive ? 500 : 400,
                      }}
                    >
                      {isActive && (
                        <span
                          style={{
                            position: "absolute", left: 0, top: "20%", bottom: "20%",
                            width: 2, background: "#3B6D11", borderRadius: "0 2px 2px 0",
                          }}
                        />
                      )}
                      <Icon size={13} />
                      {label}
                      {badge && (
                        <span
                          style={{
                            marginLeft: "auto", fontSize: 10, fontWeight: 500,
                            padding: "1px 5px", borderRadius: 4,
                            background: badgeType === "red"
                              ? (theme.dark ? "rgba(163,45,45,0.15)" : "#FCEBEB")
                              : (theme.dark ? "rgba(186,117,23,0.15)" : "#FAEEDA"),
                            color: badgeType === "red" ? "#A32D2D" : "#633806",
                          }}
                        >
                          {badge}
                        </span>
                      )}
                    </button>
                  );
                })}
                <div style={{ height: "0.5px", background: bdr, margin: "6px 0" }} />
              </div>
            ))}

            {/* System health bars */}
            <div style={{ padding: "8px 10px" }}>
              <div
                style={{
                  fontSize: 10, fontWeight: 500, color: sub,
                  textTransform: "uppercase", letterSpacing: ".7px", marginBottom: 10,
                }}
              >
                Health
              </div>
              {healthData.map((h) => (
                <div key={h.label} style={{ marginBottom: 8 }}>
                  <div
                    style={{
                      display: "flex", justifyContent: "space-between",
                      fontSize: 11, marginBottom: 3,
                    }}
                  >
                    <span style={{ color: sub }}>{h.label}</span>
                    <span style={{ color: txt, fontFamily: fontMono }}>{h.val}%</span>
                  </div>
                  <div style={{ height: 3, background: bdr, borderRadius: 9 }}>
                    <div
                      style={{
                        height: 3, borderRadius: 9,
                        width: `${h.val}%`, transition: "width 0.8s",
                        background: h.val > 80 ? "#E24B4A" : h.val > 60 ? "#BA7517" : h.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}