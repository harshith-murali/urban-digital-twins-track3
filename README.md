# UrbanTwins v2

A real-time smart city digital twin dashboard built with Next.js. Monitor traffic, energy, water, and disaster systems across a live city graph — with AI-powered recommendations, Dijkstra's pathfinding, and flood simulation.

![UrbanTwins Dashboard](https://img.shields.io/badge/Next.js-16.2-black?style=flat-square&logo=next.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=flat-square&logo=mongodb)
![Leaflet](https://img.shields.io/badge/Leaflet-Maps-brightgreen?style=flat-square)
![Clerk](https://img.shields.io/badge/Clerk-Auth-purple?style=flat-square)

---

## Features

### 🗺️ Live City Map
- Interactive Leaflet map centred on Bengaluru
- Nodes colour-coded by load: green (clear) → orange (moderate) → red (critical) → blue (flooded)
- Road edges rendered between nodes, turning blue when a flood blocks them
- Click any two nodes to compute and highlight the shortest path

### 🚦 Traffic Mode
- Live vehicle count, average speed, and congestion percentage
- Node load values simulate in real time (updated every 3 seconds)
- Auto-alert system fires when any node exceeds 80% load

### ⚡ Energy & 💧 Water Modes
- System health bars for all four infrastructure categories
- Mode-aware status badges in the navbar

### 🌊 Disaster Mode — Flood Simulation
- **Trigger Flood** randomly selects 2–4 city nodes and blocks them plus their connected edges
- Flooded nodes and roads turn blue on the map instantly
- Dijkstra's algorithm automatically excludes blocked nodes/edges when computing paths
- **Reset City** restores the full graph and clears all incidents from the database
- Every flood event is logged to MongoDB with zone names, severity, and timestamp

### 🔀 Dijkstra's Pathfinding
- Click two nodes on the map → shortest path highlighted in yellow
- **Auto-Route** button picks a random valid source/destination and runs the algorithm
- Fully bidirectional edge traversal — works regardless of edge direction in the data
- Flooded/blocked nodes and edges are excluded from the graph before pathfinding begins
- Path displayed as node-by-node hop list in the Route History panel

### 🤖 AI Advisor
- Streams real-time infrastructure recommendations via `/api/ai-advice`
- Analyses the most critical node at the time of the request
- Mode-aware: gives different advice for traffic, energy, water, and disaster scenarios

### 📋 Sidebar Tools
| Tool | Description |
|------|-------------|
| **Incident Log** | All auto-generated alerts with load %, mode, and timestamp. Badge shows unread count. |
| **Route History** | Step-by-step breakdown of the last computed Dijkstra path |
| **City Graph** | Live node/edge summary — counts, load percentages, blocked status, edge weights |

### 🌙 Dark / Light Mode
- Full theme toggle persisted via Tailwind's `dark` class on `<html>`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Auth | Clerk |
| Map | React-Leaflet + OpenStreetMap |
| Database | MongoDB Atlas |
| Animations | Framer Motion |
| Styling | Tailwind CSS |
| Icons | Lucide React |

---

## Project Structure

```
src/
├── app/
│   ├── page.js                  # Main dashboard
│   └── api/
│       ├── ai-advice/
│       │   └── route.js         # Streaming AI recommendations
│       └── incidents/
│           └── route.js         # GET / POST / DELETE incidents
├── components/
│   └── MapView.jsx              # Leaflet map with nodes, edges, path overlay
├── data/
│   └── cityGraph.js             # Node and edge definitions for Bengaluru
├── lib/
│   └── mongodb.js               # MongoDB client singleton
└── modes/
    └── traffic.js               # Dijkstra's algorithm (traffic + disaster)
```

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/your-username/urban-twins.git
cd urban-twins
npm install
```

### 2. Environment variables

Create a `.env.local` file in the project root:

```env
# MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority

# Clerk authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# AI advice endpoint key (if using Gemini or another provider)
GEMINI_API_KEY=your_key_here
```

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Key Files Explained

### `src/modes/traffic.js` — Dijkstra's Algorithm
Computes the shortest path between two city nodes. Blocked nodes (flooded zones) and blocked edges (flooded roads) are excluded from the graph **before** pathfinding begins. All edges are treated as bidirectional so paths work regardless of the direction stored in `cityGraph.js`.

### `src/components/MapView.jsx` — Map Rendering
`MapContainer` is mounted **once** and never remounted. Individual `CircleMarker` components use a composite `key` that encodes `isBlocked`, load bucket, and path membership — forcing Leaflet to recreate markers whenever their visual state changes, since Leaflet doesn't watch React props for style updates after initial mount.

### `src/app/api/incidents/route.js` — Incident API
- `GET` — returns the last 20 incidents sorted by timestamp
- `POST` — saves a new incident (called automatically on flood trigger)
- `DELETE` — clears all incidents (called on city reset)

### `src/lib/mongodb.js` — MongoDB Singleton
Reuses a single `MongoClient` across hot reloads in development using a global variable, preventing connection pool exhaustion.

---

## How the Flood Simulation Works

1. User clicks **Trigger Flood** in Disaster mode
2. `triggerFlood()` randomly picks 2–4 node IDs from the live graph
3. Those nodes are set to `isBlocked: true`; all edges connecting them are also blocked
4. The map immediately recolours flooded nodes and roads blue
5. The incident is POSTed to MongoDB with zone names and severity
6. Any subsequent Dijkstra call (manual click or Auto-Route) will route **around** the flooded zones
7. Clicking **Reset City** restores `cityGraph` to its original state and calls `DELETE /api/incidents`

---

## Alerts System

Every 3 seconds the simulation updates node load values. After each update, any node with `load > 80%` triggers an alert entry. Alerts are deduplicated — the same node won't fire again within 15 seconds. They appear in the Alert Log panel (bottom right) and the Incident Log sidebar tool, with a live badge count.

---

## License

MIT