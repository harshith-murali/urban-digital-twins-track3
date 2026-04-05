"use client";
import { useContext } from "react";
import { SharedStateContext } from "@/app/context/SharedStateContext";

const TOOLTIP_STYLE = {
  position: "absolute",
  bottom: "calc(100% + 8px)",
  left: "50%",
  transform: "translateX(-50%)",
  background: "rgba(18,22,34,0.92)",
  color: "#e8eaf0",
  fontSize: 10,
  fontWeight: 500,
  padding: "4px 8px",
  borderRadius: 6,
  whiteSpace: "nowrap",
  pointerEvents: "none",
  opacity: 0,
  transition: "opacity 0.15s",
  zIndex: 100,
};

function TooltipBtn({ children, tooltip, onClick, style }) {
  return (
    <div
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={(e) => {
        const tip = e.currentTarget.querySelector(".tip");
        if (tip) tip.style.opacity = "1";
      }}
      onMouseLeave={(e) => {
        const tip = e.currentTarget.querySelector(".tip");
        if (tip) tip.style.opacity = "0";
      }}
    >
      <button onClick={onClick} style={style}>{children}</button>
      <span className="tip" style={TOOLTIP_STYLE}>{tooltip}</span>
    </div>
  );
}

/**
 * Renders the mode-specific action button with toast feedback and tooltips:
 * - Disaster: Trigger / Reset Flood
 * - Energy:   Simulate / Restore Failure
 * - Water:    Simulate / Restore Burst
 * - Traffic:  nothing
 */
export default function ActionButtons({
  theme,
  mode,
  floodActive,   handleTriggerFlood, handleResetFlood,
  failedStation, handleSimulateFailure, handleResetEnergy,
  burstActive,   handleSimulateBurst,  handleResetWater,
}) {
  const { bdr, inputBg, sub, fontBody } = theme;
  const ctx = useContext(SharedStateContext);
  const toast = ctx?.toast ?? (() => {});

  const base = {
    padding: "5px 12px", borderRadius: 6, fontSize: 11,
    fontWeight: 500, fontFamily: fontBody, cursor: "pointer",
    border: `0.5px solid ${bdr}`,
    transition: "all 0.15s",
  };

  if (mode === "disaster") {
    const active = floodActive;
    return (
      <TooltipBtn
        tooltip={active ? "Reset all flooded zones to normal" : "Simulate a city-wide flood event"}
        onClick={() => {
          if (active) {
            handleResetFlood();
            toast({ message: "Flood cleared — city systems restored", type: "success" });
          } else {
            handleTriggerFlood();
            toast({ message: "⚠ Flood triggered — rerouting evacuation paths", type: "error" });
          }
        }}
        style={{
          ...base,
          background:   active ? inputBg : theme.dark ? "rgba(163,45,45,0.10)" : "#FCEBEB",
          border:       `0.5px solid ${active ? bdr : "rgba(163,45,45,0.30)"}`,
          color:        active ? sub : "#A32D2D",
        }}
      >
        {active ? "↺ Reset City" : "⚡ Trigger Flood"}
      </TooltipBtn>
    );
  }

  if (mode === "energy") {
    const active = failedStation;
    return (
      <TooltipBtn
        tooltip={active ? "Restore failed power station to grid" : "Simulate a substation power failure"}
        onClick={() => {
          if (active) {
            handleResetEnergy();
            toast({ message: "Grid restored — all stations back online", type: "success" });
          } else {
            handleSimulateFailure();
            toast({ message: "⚡ Station failure — redistributing grid load", type: "warning" });
          }
        }}
        style={{
          ...base,
          background: active ? inputBg : theme.dark ? "rgba(186,117,23,0.10)" : "#FAEEDA",
          border:     `0.5px solid ${active ? bdr : "rgba(186,117,23,0.30)"}`,
          color:      active ? sub : "#BA7517",
        }}
      >
        {active ? "↺ Restore Grid" : "⚡ Simulate Failure"}
      </TooltipBtn>
    );
  }

  if (mode === "water") {
    const active = burstActive;
    return (
      <TooltipBtn
        tooltip={active ? "Repair the burst pipe and restore pressure" : "Simulate a water main burst in Zone 7"}
        onClick={() => {
          if (active) {
            handleResetWater();
            toast({ message: "Pipe repaired — water pressure normalised", type: "success" });
          } else {
            handleSimulateBurst();
            toast({ message: "💧 Pipe burst detected in Zone 7!", type: "warning" });
          }
        }}
        style={{
          ...base,
          background: active ? inputBg : theme.dark ? "rgba(24,95,165,0.10)" : "#E6F1FB",
          border:     `0.5px solid ${active ? bdr : "rgba(24,95,165,0.30)"}`,
          color:      active ? sub : "#185FA5",
        }}
      >
        {active ? "↺ Restore Pipes" : "💧 Simulate Burst"}
      </TooltipBtn>
    );
  }

  return null;
}