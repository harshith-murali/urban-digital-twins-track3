"use client";
import { Moon, Sun, Bell, X } from "lucide-react";
import { PAGES, MODES } from "@/app/constants/modes.js";
import ProfilePlanDropdown from "@/components/ProfilePlanDropdown";

/**
 * Top navigation bar.
 * Handles: hamburger, logo, page tabs, clock, notifications, dark toggle, user avatar.
 */
export default function Navbar({
  theme,
  page, setPage,
  mode, setMode,
  dark, setDark,
  time,
  alerts,
  drawerOpen, setDrawerOpen,
  notifOpen, setNotifOpen,
}) {
  const { card, bdr, inputBg, sub, txt, fontBody, fontMono } = theme;

  const handlePageClick = (p) => {
    setPage(p);
    if (MODES.find((m) => m.id === p)) setMode(p);
  };

  return (
    <header
      style={{
        height: 52,
        background: card,
        borderBottom: `0.5px solid ${bdr}`,
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: 12,
        position: "relative",
        zIndex: 20,
        flexShrink: 0,
      }}
    >
      {/* Hamburger */}
      <button
        id="menu-btn"
        onClick={() => setDrawerOpen((v) => !v)}
        style={{
          width: 34, height: 34, borderRadius: 8,
          border: `0.5px solid ${bdr}`, background: inputBg,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 4.5, cursor: "pointer", flexShrink: 0,
        }}
      >
        {drawerOpen ? (
          <X size={14} style={{ color: sub }} />
        ) : (
          <>
            <span style={{ display: "block", width: 14, height: 1.5, background: sub, borderRadius: 1 }} />
            <span style={{ display: "block", width: 14, height: 1.5, background: sub, borderRadius: 1 }} />
            <span style={{ display: "block", width: 14, height: 1.5, background: sub, borderRadius: 1 }} />
          </>
        )}
      </button>

      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* City SVG icon */}
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="10" width="4" height="11" rx="1" fill="#639922" opacity="0.9"/>
          <rect x="6" y="6" width="5" height="15" rx="1" fill="#3B6D11"/>
          <rect x="12" y="3" width="6" height="18" rx="1" fill="#639922"/>
          <rect x="12" y="8" width="2" height="2" rx="0.4" fill="white" opacity="0.7"/>
          <rect x="15" y="8" width="2" height="2" rx="0.4" fill="white" opacity="0.7"/>
          <rect x="12" y="12" width="2" height="2" rx="0.4" fill="white" opacity="0.7"/>
          <rect x="15" y="12" width="2" height="2" rx="0.4" fill="white" opacity="0.7"/>
          <rect x="7" y="10" width="1.5" height="2" rx="0.3" fill="white" opacity="0.6"/>
          <rect x="7" y="14" width="1.5" height="2" rx="0.3" fill="white" opacity="0.6"/>
          <rect x="2" y="13" width="1.5" height="2" rx="0.3" fill="white" opacity="0.5"/>
        </svg>
        <span style={{
          fontSize: 15, fontWeight: 700, fontFamily: fontBody,
          color: theme.dark ? "#97C459" : "#3B6D11",
          letterSpacing: "-0.3px",
        }}>
          Urban<span style={{ fontWeight: 400, color: theme.dark ? "#639922" : "#5a9b1a" }}>Twins</span>
        </span>
        <div
          style={{
            display: "flex", alignItems: "center", gap: 4,
            fontSize: 10, fontWeight: 600, color: "#3B6D11",
            background: theme.dark ? "rgba(59,109,17,0.15)" : "#EAF3DE",
            padding: "2px 7px", borderRadius: 20,
            letterSpacing: "0.3px",
          }}
        >
          <div
            style={{
              width: 5, height: 5, borderRadius: "50%",
              background: "#639922", animation: "pulse 2s infinite",
            }}
          />
          LIVE
        </div>
      </div>

      {/* Page tabs — exclude pricing/docs (shown on right) */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 8 }}>
        {PAGES.filter((p) => p !== "pricing" && p !== "docs").map((p) => (
          <button
            key={p}
            onClick={() => handlePageClick(p)}
            style={{
              fontSize: 12, padding: "5px 10px", borderRadius: 6, border: "none",
              background: page === p ? (theme.dark ? "rgba(59,109,17,0.15)" : "#EAF3DE") : "none",
              color: page === p ? (theme.dark ? "#97C459" : "#27500A") : sub,
              fontWeight: page === p ? 500 : 400,
              cursor: "pointer", fontFamily: fontBody,
              transition: "all .12s", textTransform: "capitalize",
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Right controls */}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
        {/* Pricing & Docs links */}
        <div style={{ display: "flex", alignItems: "center", gap: 2, borderRight: `0.5px solid ${bdr}`, paddingRight: 10, marginRight: 2 }}>
          {["pricing", "docs"].map((p) => (
            <button
              key={p}
              onClick={() => handlePageClick(p)}
              style={{
                fontSize: 11, padding: "4px 9px", borderRadius: 6, border: "none",
                background: page === p ? (theme.dark ? "rgba(59,109,17,0.15)" : "#EAF3DE") : "none",
                color: page === p ? (theme.dark ? "#97C459" : "#27500A") : sub,
                fontWeight: page === p ? 600 : 400,
                cursor: "pointer", fontFamily: fontBody,
                transition: "all .12s", textTransform: "capitalize",
              }}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Clock */}
        <span
          style={{
            fontSize: 11, fontFamily: fontMono, color: sub,
            padding: "4px 8px", background: inputBg, borderRadius: 6,
          }}
        >
          {time}
        </span>

        <button
          title="View alerts"
          style={{
            position: "relative",
            width: 36,
            height: 36,
            borderRadius: 10,
            border: `0.5px solid ${bdr}`,
            background: inputBg,
            color: sub,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
          onClick={() => setNotifOpen((open) => !open)}
        >
          <Bell size={16} />
          {alerts.length > 0 && (
            <span style={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#E24B4A",
              boxShadow: "0 0 0 3px rgba(226,75,74,0.16)",
            }} />
          )}
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={() => setDark(!dark)}
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border: `0.5px solid ${bdr}`,
            background: inputBg,
            color: sub,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Profile + plan dropdown */}
        <ProfilePlanDropdown theme={theme} />
      </div>
    </header>
  );
}