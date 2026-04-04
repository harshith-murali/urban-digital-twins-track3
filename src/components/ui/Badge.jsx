"use client";

const COLOR_MAP = {
  green:   { bg: (dark) => dark ? "rgba(59,109,17,0.15)"  : "#EAF3DE", color: (dark) => dark ? "#97C459" : "#27500A" },
  red:     { bg: (dark) => dark ? "rgba(163,45,45,0.15)"  : "#FCEBEB", color: (dark) => dark ? "#F09595" : "#A32D2D" },
  amber:   { bg: (dark) => dark ? "rgba(186,117,23,0.15)" : "#FAEEDA", color: (dark) => dark ? "#EF9F27" : "#633806" },
  blue:    { bg: (dark) => dark ? "rgba(24,95,165,0.15)"  : "#E6F1FB", color: (dark) => dark ? "#85B7EB" : "#0C447C" },
  neutral: { bg: (_)    => "transparent",                               color: (_)    => "#888898" },
};

/**
 * Small coloured pill label placed under stat values.
 *
 * @param {string} label   - text to display
 * @param {string} type    - "green" | "red" | "amber" | "blue" | "neutral"
 * @param {object} theme   - theme object from buildTheme()
 */
export default function Badge({ label, type = "neutral", theme }) {
  const { dark, inputBg, fontMono } = theme;
  const c = COLOR_MAP[type] ?? COLOR_MAP.neutral;
  return (
    <span
      style={{
        fontSize: 10,
        padding: "2px 7px",
        borderRadius: 4,
        fontWeight: 600,
        background: c.bg(dark),
        color: c.color(dark),
        fontFamily: fontMono,
        letterSpacing: "0.04em",
        display: "inline-block",
        marginTop: 4,
      }}
    >
      {label}
    </span>
  );
}