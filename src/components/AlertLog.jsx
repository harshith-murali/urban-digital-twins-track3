"use client";
import { motion, AnimatePresence } from "framer-motion";
import { MODES } from "@/app/constants/modes.js";

/**
 * Scrollable log of infrastructure alerts.
 *
 * @param {Array}  alerts     - alert objects from useAlerts
 * @param {number} maxHeight  - max height of the scrollable list
 * @param {number} limit      - max number of entries to show
 */
export default function AlertLog({ theme, alerts, maxHeight = 130, limit = 50 }) {
  const { card, bdr, inputBg, sub, txt, fontBody, fontMono } = theme;

  return (
    <div
      style={{
        background: card, border: `0.5px solid ${bdr}`,
        borderRadius: 10, padding: 14, flexShrink: 0,
      }}
    >
      <div
        style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between", marginBottom: 10,
        }}
      >
        <p style={{ fontSize: 13, fontWeight: 500, color: txt, fontFamily: fontBody }}>Alert Log</p>
        <span style={{ color: sub, fontSize: 11, fontFamily: fontBody }}>{alerts.length} events</span>
      </div>

      <div
        style={{
          display: "flex", flexDirection: "column", gap: 5,
          maxHeight, overflowY: "auto",
        }}
      >
        <AnimatePresence>
          {alerts.length === 0 ? (
            <p style={{ color: sub, fontSize: 12, fontFamily: fontBody }}>No alerts yet.</p>
          ) : (
            alerts.slice(0, limit).map((a) => (
              <motion.div
                key={a.id + a.ts}
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  background: inputBg, borderRadius: 5,
                  padding: "5px 9px",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}
              >
                <span style={{ color: a.load > 90 ? "#E24B4A" : "#BA7517", fontSize: 11, fontFamily: fontBody }}>
                  {a.label}
                </span>
                <span style={{ color: sub, fontSize: 10, fontFamily: fontMono }}>{a.time}</span>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}