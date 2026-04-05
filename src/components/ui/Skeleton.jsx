"use client";

/**
 * Animated shimmer skeleton placeholder.
 * Usage: <Skeleton width={80} height={28} />
 */
export default function Skeleton({ width = "100%", height = 20, radius = 6, style = {} }) {
  return (
    <span style={{
      display: "inline-block",
      width,
      height,
      borderRadius: radius,
      background: "linear-gradient(90deg, rgba(180,180,180,0.12) 25%, rgba(180,180,180,0.22) 50%, rgba(180,180,180,0.12) 75%)",
      backgroundSize: "200% 100%",
      animation: "skeleton-shimmer 1.4s ease-in-out infinite",
      verticalAlign: "middle",
      ...style,
    }} />
  );
}
