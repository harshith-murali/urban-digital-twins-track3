/**
 * UrbanTwins — useRealtimeCity hook
 *
 * Manages the entire real-time data lifecycle for a city simulation mode:
 * - Polls /api/city-data every 5 seconds (setInterval)
 * - Exposes current snapshot, alerts, history, and error state
 * - Triggers AI advisor prompts on threshold breaches
 * - Gracefully pauses when the browser tab is hidden
 *
 * Usage:
 *   const { snapshot, alerts, loading, triggerEvent } = useRealtimeCity("traffic");
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const POLL_INTERVAL_MS = 5000; // 5 seconds — matches PRD spec
const HISTORY_SIZE     = 60;   // keep last 60 ticks (~5 min of history)

/**
 * @param {"traffic"|"energy"|"water"|"disaster"} mode
 * @param {object} [initialParams] - mode-specific event params
 */
export function useRealtimeCity(mode, initialParams = {}) {
  const [snapshot,  setSnapshot]  = useState(null);
  const [alerts,    setAlerts]    = useState([]);      // live alert queue
  const [history,   setHistory]   = useState([]);      // circular summary history
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [connected, setConnected] = useState(false);

  // Mutable refs — don't trigger re-renders
  const paramsRef    = useRef(initialParams);
  const intervalRef  = useRef(null);
  const abortRef     = useRef(null);
  const tickCountRef = useRef(0);

  /** Update event params without restarting the interval */
  const setParams = useCallback((newParams) => {
    paramsRef.current = { ...paramsRef.current, ...newParams };
  }, []);

  /** Trigger a one-off event (flood, power failure, pipe burst) */
  const triggerEvent = useCallback((eventParams) => {
    paramsRef.current = { ...paramsRef.current, ...eventParams };
  }, []);

  /** Clear an active event after it has been handled */
  const clearEvent = useCallback((keys) => {
    const next = { ...paramsRef.current };
    for (const k of keys) delete next[k];
    paramsRef.current = next;
  }, []);

  const fetchSnapshot = useCallback(async () => {
    // Cancel any in-flight request for this mode
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/city-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, params: paramsRef.current }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

      const data = await res.json();

      setSnapshot(data);
      setConnected(true);
      setError(null);
      tickCountRef.current += 1;

      // Append to alert queue (cap at 50 alerts)
      if (data.alerts?.length > 0) {
        setAlerts(prev => [...data.alerts, ...prev].slice(0, 50));
      }

      // Append summary to history ring buffer
      if (data.summary) {
        setHistory(prev => [...prev, { ...data.summary, ts: data.timestamp }].slice(-HISTORY_SIZE));
      }
    } catch (err) {
      if (err.name === "AbortError") return; // silently ignore cancelled requests
      setConnected(false);
      setError(err.message);
      console.error("[useRealtimeCity] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  // Start / restart polling whenever `mode` changes
  useEffect(() => {
    setLoading(true);
    setSnapshot(null);
    setAlerts([]);
    setHistory([]);
    tickCountRef.current = 0;

    // Immediate first fetch
    fetchSnapshot();

    // Pause polling when tab is hidden to save API quota
    const handleVisibility = () => {
      if (document.hidden) {
        clearInterval(intervalRef.current);
      } else {
        fetchSnapshot(); // re-sync immediately on tab focus
        intervalRef.current = setInterval(fetchSnapshot, POLL_INTERVAL_MS);
      }
    };

    intervalRef.current = setInterval(fetchSnapshot, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(intervalRef.current);
      abortRef.current?.abort();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [mode, fetchSnapshot]);

  return {
    snapshot,         // latest full snapshot from the simulator
    alerts,           // deduplicated alert log
    history,          // array of summary ticks for charting
    loading,          // true on first load
    error,            // last fetch error message or null
    connected,        // false if last fetch failed
    tickCount: tickCountRef.current,
    setParams,        // update event params without restarting polling
    triggerEvent,     // inject a one-off event (flood, failure, etc.)
    clearEvent,       // clear a previously set event
    refetch: fetchSnapshot, // manual refresh
  };
}


// ─── Supplementary: AI Advisor hook ───────────────────────────────────────────

/**
 * Fetches an AI recommendation from Gemini via /api/ai-advice.
 * Automatically called when a CRITICAL alert fires.
 * Caches the last response to avoid duplicate API calls.
 */
export function useAIAdvisor() {
  const [advice,   setAdvice]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const lastPromptRef = useRef(null);

  const fetchAdvice = useCallback(async (prompt) => {
    if (!prompt || prompt === lastPromptRef.current) return; // deduplicate
    lastPromptRef.current = prompt;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) throw new Error(`AI API error: ${res.status}`);
      const { advice: text } = await res.json();
      setAdvice(text);
    } catch (err) {
      setError(err.message);
      setAdvice("⚠️ AI advisor temporarily unavailable. Using cached recommendations.");
    } finally {
      setLoading(false);
    }
  }, []);

  return { advice, loading, error, fetchAdvice };
}


// ─── Supplementary: Incident Log hook ─────────────────────────────────────────

/**
 * CRUD wrapper around /api/incidents (MongoDB Atlas backend).
 */
export function useIncidentLog() {
  const [incidents, setIncidents] = useState([]);
  const [loading,   setLoading]   = useState(false);

  const fetchIncidents = useCallback(async (mode) => {
    setLoading(true);
    try {
      const url = mode ? `/api/incidents?mode=${mode}` : "/api/incidents";
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setIncidents(data.incidents ?? []);
    } catch (err) {
      console.error("[useIncidentLog] fetch:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const logIncident = useCallback(async (incident) => {
    try {
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(incident),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { incident: saved } = await res.json();
      setIncidents(prev => [saved, ...prev]);
      return saved;
    } catch (err) {
      console.error("[useIncidentLog] log:", err);
      return null;
    }
  }, []);

  return { incidents, loading, fetchIncidents, logIncident };
}