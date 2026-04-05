"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Smoothly animates a numeric value from its previous state to the new one.
 * @param {number} value - The target value
 * @param {number} duration - Animation duration in ms (default 600)
 * @returns {number} The currently displayed (interpolated) value
 */
export function useCountUp(value, duration = 600) {
  const [display, setDisplay] = useState(value);
  const prev    = useRef(value);
  const frame   = useRef(null);
  const startTs = useRef(null);

  useEffect(() => {
    const from = prev.current;
    const to   = value;
    if (from === to) return;

    startTs.current = null;

    const animate = (ts) => {
      if (!startTs.current) startTs.current = ts;
      const elapsed  = ts - startTs.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) {
        frame.current = requestAnimationFrame(animate);
      } else {
        prev.current = to;
      }
    };

    frame.current = requestAnimationFrame(animate);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [value, duration]);

  return display;
}
