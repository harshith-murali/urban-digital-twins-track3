"use client";
import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ICONS = {
  success: "✓",
  error:   "✕",
  warning: "⚠",
  info:    "ℹ",
};

const COLORS = {
  success: { border: "rgba(99,153,34,0.5)",  bg: "rgba(99,153,34,0.12)",  text: "#639922" },
  error:   { border: "rgba(226,75,74,0.5)",  bg: "rgba(226,75,74,0.12)",  text: "#E24B4A" },
  warning: { border: "rgba(186,117,23,0.5)", bg: "rgba(186,117,23,0.12)", text: "#BA7517" },
  info:    { border: "rgba(24,95,165,0.5)",  bg: "rgba(24,95,165,0.12)",  text: "#185FA5" },
};

export function useToast() {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const toast = useCallback(({ message, type = "info", duration = 3500 }) => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, toast, dismiss };
}

export function ToastContainer({ toasts, dismiss, theme }) {
  const dark = theme?.dark;

  return (
    <div style={{
      position: "fixed",
      bottom: 24,
      right: 24,
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      gap: 10,
      pointerEvents: "none",
    }}>
      <AnimatePresence>
        {toasts.map((t) => {
          const c = COLORS[t.type] ?? COLORS.info;
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              style={{
                pointerEvents: "all",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 16px",
                borderRadius: 12,
                background: dark ? `rgba(18,22,34,0.96)` : "rgba(255,255,255,0.97)",
                border: `1px solid ${c.border}`,
                boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                backdropFilter: "blur(12px)",
                minWidth: 240,
                maxWidth: 340,
              }}
            >
              <span style={{
                width: 28, height: 28, borderRadius: "50%",
                background: c.bg, display: "flex", alignItems: "center",
                justifyContent: "center", flexShrink: 0,
                fontSize: 13, fontWeight: 700, color: c.text,
              }}>
                {ICONS[t.type]}
              </span>
              <span style={{
                flex: 1, fontSize: 12, fontWeight: 500,
                color: dark ? "#e8eaf0" : "#1a1d2e",
                lineHeight: 1.4,
              }}>
                {t.message}
              </span>
              <button
                onClick={() => dismiss(t.id)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: dark ? "#555d7a" : "#9ba3b8",
                  fontSize: 16, lineHeight: 1, padding: 2, flexShrink: 0,
                }}
              >
                ×
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
