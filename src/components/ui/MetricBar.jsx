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
export default function MetricBar({ label, pct, value, color, theme }) {
  const { sub, bdr, txt, fontBody, fontMono } = theme;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <span style={{ color: sub, width: 70, flexShrink: 0, fontSize: 11, fontFamily: fontBody }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 4, background: bdr, borderRadius: 3, overflow: "hidden" }}>
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.0 }}
          style={{ height: 4, borderRadius: 3, background: color }}
        />
      </div>
      <span style={{ fontSize: 11, fontFamily: fontMono, color: txt, width: 42, textAlign: "right" }}>
        {value}
      </span>
    </div>
  );
}
