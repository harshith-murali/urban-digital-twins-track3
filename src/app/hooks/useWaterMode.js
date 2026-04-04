"use client";
import { useState, useEffect } from "react";

const INITIAL_PRESSURES = { Z1: 3.4, Z3: 3.0, Z7: 1.4, Z8: 3.2 };

/**
 * Manages Water-mode state: zone pressures and pipe burst simulation.
 *
 * @param {string}   mode            - current active mode (effect only runs in "water")
 * @param {Function} addAlert        - adds an entry to the alert log
 * @param {Function} clearModeAlerts - removes alerts for a given mode
 */
export function useWaterMode({ mode, addAlert, clearModeAlerts }) {
  const [burstActive, setBurstActive]     = useState(false);
  const [zonePressures, setZonePressures] = useState(INITIAL_PRESSURES);

  // Gently fluctuate Z1 and Z3 pressures every 5 s when in water mode
  useEffect(() => {
    if (mode !== "water") return;
    const iv = setInterval(() => {
      setZonePressures((z) => ({
        ...z,
        Z1: parseFloat((3.4 + Math.random() * 0.2).toFixed(2)),
        Z3: parseFloat((3.0 + Math.random() * 0.2).toFixed(2)),
      }));
    }, 5000);
    return () => clearInterval(iv);
  }, [mode]);

  const handleSimulateBurst = () => {
    setBurstActive(true);
    setZonePressures((z) => ({ ...z, Z7: 0.6 }));
    addAlert({
      id:    "Z7",
      label: "ORR Zone pipe burst — pressure 0.6 bar",
      load:  95,
      mode:  "water",
      time:  new Date().toLocaleTimeString(),
    });
  };

  const handleResetWater = () => {
    setBurstActive(false);
    setZonePressures(INITIAL_PRESSURES);
    clearModeAlerts("water");
  };

  const z7Pressure = zonePressures.Z7 ?? 1.4;

  return {
    burstActive,
    zonePressures,
    z7Pressure,
    handleSimulateBurst,
    handleResetWater,
  };
}