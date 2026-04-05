"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, RefreshCw } from "lucide-react";
import { parseAdviceLines } from "@/lib/graphUtils";

/**
 * AI Advisor panel — calls /api/ai-advice and streams the response.
 * Can be used in the Overview page (compact) or mode pages (full-height).
 */
export default function AIAdvisor({
  theme,
  mode,
  accent,
  graph,
  compact = false,
}) {
  const [advice, setAdvice] = useState("");
  const [loading, setLoading] = useState(false);

  const { card, bdr, inputBg, sub, txt, fontBody, fontMono, dark } = theme;

  const getAIAdvice = async () => {
    setLoading(true);
    setAdvice("");
    try {
      const critical = graph.nodes.find((n) => n.load > 80) || graph.nodes[0];
      const prompt = `You are an urban infrastructure advisor. The current mode is ${mode}. Zone "${critical.label}" is at ${Math.round(critical.load)}% load. Provide 3 concise actionable recommendations to address this situation.`;

      const res = await fetch("/api/ai-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (data.advice) {
        setAdvice(data.advice);
      } else {
        setAdvice("No advice returned.");
      }
    } catch {
      setAdvice("Failed to fetch advice.");
    } finally {
      setLoading(false);
    }
  };

  const lines = parseAdviceLines(advice);

  return (
    <div
      style={{
        background: card,
        border: `0.5px solid ${bdr}`,
        borderRadius: 10,
        padding: 14,
        flex: compact ? undefined : 1,
        display: "flex",
        flexDirection: "column",
        overflow: compact ? "hidden" : undefined,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Sparkles size={13} style={{ color: accent }} />
          <p
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: txt,
              fontFamily: fontBody,
            }}
          >
            AI Advisor
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={getAIAdvice}
          disabled={loading}
          style={{
            fontSize: 11,
            fontFamily: fontBody,
            padding: "4px 10px",
            borderRadius: 6,
            border: `0.5px solid ${bdr}`,
            background: inputBg,
            color: sub,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <RefreshCw size={10} className={loading ? "animate-spin" : ""} />
          {loading ? "Analyzing…" : "Refresh"}
        </motion.button>
      </div>

      {!compact && (
        <p
          style={{
            color: sub,
            fontSize: 11,
            marginBottom: 12,
            fontFamily: fontBody,
          }}
        >
          AI-powered infrastructure recommendations
        </p>
      )}

      {/* Body */}
      {advice || loading ? (
        <div
          style={{ background: inputBg, borderRadius: 6, padding: 10, flex: 1 }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: ".7px",
              color: sub,
              marginBottom: 8,
              fontFamily: fontBody,
            }}
          >
            {mode} analysis
          </div>
          {loading && !advice ? (
            [1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse"
                style={{
                  height: 10,
                  borderRadius: 6,
                  background: theme.bdr,
                  width: i === 3 ? "60%" : "100%",
                  opacity: 0.5,
                  marginBottom: 8,
                }}
              />
            ))
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {lines.map((line, i) => (
                <div
                  key={i}
                  style={{ display: "flex", gap: 7, alignItems: "flex-start" }}
                >
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 9,
                      fontWeight: 600,
                      marginTop: 1,
                      background: dark ? "rgba(59,109,17,0.15)" : "#EAF3DE",
                      color: "#27500A",
                    }}
                  >
                    {i + 1}
                  </span>
                  <p
                    style={{
                      color: sub,
                      fontSize: 11,
                      lineHeight: 1.55,
                      margin: 0,
                      fontFamily: fontBody,
                    }}
                  >
                    {line}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            background: inputBg,
            borderRadius: 6,
            padding: "14px 12px",
            border: `1px dashed ${bdr}`,
            textAlign: "center",
          }}
        >
          <Sparkles size={18} style={{ color: sub, margin: "0 auto 6px" }} />
          <p style={{ color: sub, fontSize: 12, fontFamily: fontBody }}>
            Click Refresh for real-time recommendations
          </p>
        </div>
      )}
    </div>
  );
}
