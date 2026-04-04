"use client";
import { UserButton } from "@clerk/nextjs";
import { Moon, Sun, Bell, X } from "lucide-react";
import { PAGES, MODES } from "@/app/constants/modes.js";

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
        <span style={{ fontSize: 15, fontWeight: 500, color: txt, fontFamily: fontBody }}>
          Urban<span style={{ color: "#3B6D11" }}>Twins</span>
        </span>
        <div
          style={{
            display: "flex", alignItems: "center", gap: 4,
            fontSize: 11, fontWeight: 500, color: "#3B6D11",
            background: theme.dark ? "rgba(59,109,17,0.15)" : "#EAF3DE",
            padding: "3px 8px", borderRadius: 20,
          }}
        >
          <div
            style={{
              width: 5, height: 5, borderRadius: "50%",
              background: "#639922", animation: "pulse 2s infinite",
            }}
          />
          Live
        </div>
      </div>

      {/* Page tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 8 }}>
        {PAGES.map((p) => (
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
        {/* Clock */}
        <span
          style={{
            fontSize: 11, fontFamily: fontMono, color: sub,
            padding: "4px 8px", background: inputBg, borderRadius: 6,
          }}
        >
          {time}
        </span>

        {/* Notification bell */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setNotifOpen((v) => !v)}
            style={{
              width: 30, height: 30, borderRadius: 6,
              border: `0.5px solid ${bdr}`, background: inputBg,
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}
          >
            <Bell size={13} style={{ color: sub }} />
            {alerts.length > 0 && (
              <div
                style={{
                  position: "absolute", top: 4, right: 4,
                  width: 7, height: 7, borderRadius: "50%",
                  background: "#E24B4A", border: `1.5px solid ${card}`,
                }}
              />
            )}
          </button>
        </div>

        {/* Dark mode toggle */}
        <button
          onClick={() => setDark(!dark)}
          style={{
            border: `0.5px solid ${bdr}`, background: inputBg, color: sub,
            padding: "5px 10px", borderRadius: 6, fontSize: 12,
            fontFamily: fontBody, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 5,
          }}
        >
          {dark ? <Sun size={12} /> : <Moon size={12} />}
          {dark ? "Light" : "Dark"}
        </button>

        <UserButton />
      </div>
    </header>
  );
}