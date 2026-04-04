"use client";

/**
 * Renders the mode-specific action button:
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

  const base = {
    padding: "5px 12px", borderRadius: 6, fontSize: 11,
    fontWeight: 500, fontFamily: fontBody, cursor: "pointer",
    border: `0.5px solid ${bdr}`,
  };

  if (mode === "disaster") {
    return (
      <button
        onClick={floodActive ? handleResetFlood : handleTriggerFlood}
        style={{
          ...base,
          background:   floodActive ? inputBg : theme.dark ? "rgba(163,45,45,0.10)" : "#FCEBEB",
          border:       `0.5px solid ${floodActive ? bdr : "rgba(163,45,45,0.30)"}`,
          color:        floodActive ? sub : "#A32D2D",
        }}
      >
        {floodActive ? "↺ Reset City" : "⚡ Trigger Flood"}
      </button>
    );
  }

  if (mode === "energy") {
    return (
      <button
        onClick={failedStation ? handleResetEnergy : handleSimulateFailure}
        style={{
          ...base,
          background: failedStation ? inputBg : theme.dark ? "rgba(186,117,23,0.10)" : "#FAEEDA",
          border:     `0.5px solid ${failedStation ? bdr : "rgba(186,117,23,0.30)"}`,
          color:      failedStation ? sub : "#BA7517",
        }}
      >
        {failedStation ? "↺ Restore Grid" : "⚡ Simulate Failure"}
      </button>
    );
  }

  if (mode === "water") {
    return (
      <button
        onClick={burstActive ? handleResetWater : handleSimulateBurst}
        style={{
          ...base,
          background: burstActive ? inputBg : theme.dark ? "rgba(24,95,165,0.10)" : "#E6F1FB",
          border:     `0.5px solid ${burstActive ? bdr : "rgba(24,95,165,0.30)"}`,
          color:      burstActive ? sub : "#185FA5",
        }}
      >
        {burstActive ? "↺ Restore Pipes" : "💧 Simulate Burst"}
      </button>
    );
  }

  return null;
}