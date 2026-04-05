/**
 * POST /api/ai-advice
 *
 * Body: { prompt: string }
 * Returns: { advice: string }
 *
 * Proxies requests to the Gemini API.
 * API key is read from GEMINI_API_KEY env var — never exposed to client.
 *
 * Includes:
 * - Rate limit: 1 req/5s per IP (exponential backoff hint to client)
 * - Fallback response if Gemini is unreachable
 * - Response caching by prompt hash (in-memory, resets on cold start)
 */

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

// Simple in-memory cache — survives warm Lambda invocations
const responseCache = new Map();
const CACHE_TTL_MS  = 60_000; // 60 seconds

// Per-IP rate limiter (very lightweight for hackathon scale)
const rateLimitMap = new Map(); // ip → last request timestamp
const RATE_LIMIT_MS = 2000;     // minimum 2s between calls per IP

function hashPrompt(prompt) {
  // djb2 hash — fast, good enough for cache keys
  let hash = 5381;
  for (let i = 0; i < prompt.length; i++) {
    hash = ((hash << 5) + hash) ^ prompt.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

const FALLBACK_ADVICE = {
  traffic:  "Activate alternate route signage on parallel corridors. Deploy traffic marshals at key intersections. Consider time-based entry restrictions for heavy vehicles.",
  energy:   "Engage demand-response protocols with industrial consumers. Switch to reserve substations for critical zones. Issue public advisory to reduce non-essential consumption.",
  water:    "Isolate the affected pipe segment via closest upstream valve. Deploy emergency tankers to affected zones. Notify residents to store water immediately.",
  disaster: "Activate evacuation order for flood-risk zones. Open designated shelters at higher-elevation civic buildings. Deploy emergency services to assist mobility-impaired residents.",
};

export async function POST(request) {
  // Rate limiting by IP
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const lastCall = rateLimitMap.get(ip) ?? 0;
  const now = Date.now();

  if (now - lastCall < RATE_LIMIT_MS) {
    return Response.json(
      { error: "Rate limited", retryAfterMs: RATE_LIMIT_MS - (now - lastCall) },
      { status: 429 }
    );
  }
  rateLimitMap.set(ip, now);

  let prompt;
  try {
    const body = await request.json();
    prompt = body.prompt;
    if (!prompt || typeof prompt !== "string") {
      return Response.json({ error: "prompt must be a non-empty string" }, { status: 400 });
    }
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Check cache
  const cacheKey = hashPrompt(prompt);
  const cached   = responseCache.get(cacheKey);
  if (cached && now - cached.ts < CACHE_TTL_MS) {
    return Response.json({ advice: cached.advice, cached: true });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Dev mode — return mode-keyed fallback
    const mode = ["traffic", "energy", "water", "disaster"].find(m =>
      prompt.toLowerCase().includes(m)
    ) ?? "traffic";
    return Response.json({ advice: FALLBACK_ADVICE[mode], fallback: true });
  }

  try {
    const geminiRes = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 300,
          temperature: 0.7,
          topP: 0.9,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        ],
      }),
    });

    if (!geminiRes.ok) {
      const err = await geminiRes.json();
      throw new Error(err.error?.message ?? `Gemini HTTP ${geminiRes.status}`);
    }

    const geminiData = await geminiRes.json();
    const advice = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!advice) throw new Error("Empty Gemini response");

    // Cache successful response
    responseCache.set(cacheKey, { advice, ts: now });

    return Response.json({ advice });
  } catch (err) {
    console.error("[/api/ai-advice] Gemini error:", err.message);

    // Graceful fallback
    const mode = ["traffic", "energy", "water", "disaster"].find(m =>
      prompt.toLowerCase().includes(m)
    ) ?? "traffic";

    return Response.json({
      advice: FALLBACK_ADVICE[mode],
      fallback: true,
      error: err.message,
    });
  }
}