/**
 * Deep-clones the city graph so simulations never mutate the original.
 */
export function cloneGraph(g) {
  return {
    nodes: g.nodes.map((n) => ({ ...n })),
    edges: g.edges.map((e) => ({ ...e })),
  };
}

/**
 * Strips markdown formatting from raw AI response text
 * and returns up to 4 plain lines.
 */
export function parseAdviceLines(raw) {
  return raw
    .split("\n")
    .map((l) =>
      l
        .replace(/^\*{1,2}|(\*{1,2})$/g, "")
        .replace(/^#{1,3}\s*/, "")
        .replace(/^\d+\.\s*/, "")
        .trim()
    )
    .filter(Boolean)
    .slice(0, 4);
}