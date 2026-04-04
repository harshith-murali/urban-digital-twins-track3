import clientPromise from '@/lib/dbConfig.js'

async function getDB() {
  const client = await clientPromise
  return client.db('urbantwins')
}

// GET — fetch last 20 incidents
export async function GET() {
  try {
    const db = await getDB()
    const incidents = await db.collection('incidents')
      .find({})
      .sort({ timestamp: -1 })
      .limit(20)
      .toArray()
    return Response.json({ incidents })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

// POST — save new incident
export async function POST(req) {
  try {
    const { mode, zone, severity, load, description } = await req.json()
    const db = await getDB()
    const incident = {
      mode, zone, severity,
      load, description,
      timestamp: new Date(),
    }
    await db.collection('incidents').insertOne(incident)
    return Response.json({ success: true, incident })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

// DELETE — clear all incidents
export async function DELETE() {
  try {
    const db = await getDB()
    await db.collection('incidents').deleteMany({})
    return Response.json({ success: true })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}