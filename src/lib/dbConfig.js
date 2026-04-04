import { MongoClient } from 'mongodb'

const uri = process.env.MONGO_URI
const options = {}

let client
let clientPromise

if (!uri) throw new Error('Please add MONGODB_URI to .env.local')

if (process.env.NODE_ENV === 'development') {
  // In development, reuse the client across hot reloads
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  // In production, create a new client
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export default clientPromise