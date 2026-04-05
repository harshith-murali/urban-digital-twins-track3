/**
 * POST /api/city-data
 *
 * Body: { mode: "traffic"|"energy"|"water"|"disaster", params: {} }
 * Returns: simulation snapshot for the given mode.
 *
 * This route acts as the server-side tick — it calls the simulator,
 * which maintains per-mode state across requests via module-level variables.
 *
 * For a stateless/serverless deployment (Vercel), the state resets on
 * each cold-start; for the hackathon demo this is fine since the
 * dashboard always has a warm function instance.
 */

import { tick } from "@/lib/simulator.js";

export async function POST(request) {
  try {
    const body   = await request.json();
    const { mode = "traffic", params = {} } = body;

    const VALID_MODES = ["traffic", "energy", "water", "disaster"];
    if (!VALID_MODES.includes(mode)) {
      return Response.json(
        { error: `Invalid mode: ${mode}. Must be one of ${VALID_MODES.join(", ")}` },
        { status: 400 }
      );
    }

    const snapshot = tick(mode, params);

    return Response.json(snapshot, {
      headers: {
        // Tell clients not to cache this — it's live data
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-UrbanTwins-Mode": mode,
        "X-UrbanTwins-Tick": Date.now().toString(),
      },
    });
  } catch (err) {
    console.error("[/api/city-data]", err);
    return Response.json({ error: "Simulation error", detail: err.message }, { status: 500 });
  }
}

// Reject GET requests
export async function GET() {
  return Response.json({ error: "Use POST with { mode, params }" }, { status: 405 });
}