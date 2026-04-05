/**
 * GET  /api/incidents?mode=traffic    → list incidents (optionally filtered by mode)
 * POST /api/incidents                 → create incident
 *
 * MongoDB schema:
 * { _id, mode, zone, severity, timestamp, description, aiAdvice }
 *
 * Falls back to in-memory store if MONGODB_URI is not set (hackathon dev mode).
 */

import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI = process.env.MONGO_URI;
const DB_NAME     = "urbantwins";
const COLLECTION  = "incidents";

// In-memory fallback (dev / no-Atlas mode)
const memoryStore = [];

async function getCollection() {
  if (!MONGODB_URI) return null;
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  return { collection: client.db(DB_NAME).collection(COLLECTION), client };
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode  = searchParams.get("mode");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);

  const conn = await getCollection();

  if (!conn) {
    // Fallback: return from memory store
    const filtered = mode
      ? memoryStore.filter(i => i.mode === mode)
      : memoryStore;
    return Response.json({ incidents: filtered.slice(-limit).reverse(), source: "memory" });
  }

  const { collection, client } = conn;
  try {
    const query  = mode ? { mode } : {};
    const docs   = await collection
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    return Response.json({ incidents: docs, source: "mongodb" });
  } finally {
    await client.close();
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { mode, zone, severity, description, aiAdvice } = body;

  const VALID_MODES      = ["traffic", "energy", "water", "disaster"];
  const VALID_SEVERITIES = ["INFO", "WARNING", "CRITICAL"];

  if (!VALID_MODES.includes(mode)) {
    return Response.json({ error: `Invalid mode: ${mode}` }, { status: 400 });
  }
  if (!VALID_SEVERITIES.includes(severity)) {
    return Response.json({ error: `Invalid severity: ${severity}` }, { status: 400 });
  }
  if (!zone || !description) {
    return Response.json({ error: "zone and description are required" }, { status: 400 });
  }

  const incident = {
    mode,
    zone,
    severity,
    description,
    aiAdvice: aiAdvice ?? null,
    timestamp: new Date().toISOString(),
  };

  const conn = await getCollection();

  if (!conn) {
    // Fallback: persist to memory
    const saved = { ...incident, _id: `mem_${Date.now()}` };
    memoryStore.push(saved);
    if (memoryStore.length > 200) memoryStore.shift(); // cap memory
    return Response.json({ incident: saved, source: "memory" }, { status: 201 });
  }

  const { collection, client } = conn;
  try {
    const result = await collection.insertOne(incident);
    const saved  = { ...incident, _id: result.insertedId };
    return Response.json({ incident: saved, source: "mongodb" }, { status: 201 });
  } finally {
    await client.close();
  }
}