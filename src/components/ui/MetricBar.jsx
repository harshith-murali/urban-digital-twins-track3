"use client";
import { motion } from "framer-motion";

/**
 * An animated horizontal bar used in the Live Metrics panel.
 *
 * @param {string} label  - left-side label
 * @param {number} pct    - fill percentage (0–100)
 * @param {string} value  - right-side text value
 * @param {string} color  - bar fill colour hex
 * @param {object} theme  - theme object from buildTheme()
 */
export default function MetricBar({ label, pct, value, color, theme, extra }) {
  const { sub, bdr, txt, fontBody, fontMono } = theme;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: sub, width: 70, flexShrink: 0, fontSize: 11, fontFamily: fontBody }}>
          {label}
        </span>
        <div style={{ flex: 1, minWidth: 0, height: 6, background: bdr, borderRadius: 4, overflow: "hidden" }}>
          <motion.div
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ height: 6, borderRadius: 4, background: color, transition: "all 0.3s ease" }}
          />
        </div>
        <span style={{ fontSize: 11, fontFamily: fontMono, color: txt, width: 42, textAlign: "right" }}>
          {value}
        </span>
      </div>
      {extra && (
        <span style={{ fontSize: 10, color: sub, fontFamily: fontMono, marginLeft: 78 }}>
          {extra}
        </span>
      )}
    </div>
  );
}
