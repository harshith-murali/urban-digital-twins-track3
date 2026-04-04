"use client"
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const getColor = (node) => {
  if (node.isBlocked) return "#3b82f6"
  if (node.load > 80)  return "#ef4444"
  if (node.load > 60)  return "#f97316"
  return "#22c55e"
}

export default function MapView({ nodes, edges, path, onNodeClick }) {
  const pathCoords = path
    .map(id => nodes.find(n => n.id === id))
    .filter(Boolean)
    .map(n => [n.lat, n.lng])

  return (
    <MapContainer
      center={[12.97, 77.62]}
      zoom={11}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* Edges */}
      {edges.map((edge, i) => {
        const from = nodes.find(n => n.id === edge.from)
        const to   = nodes.find(n => n.id === edge.to)
        if (!from || !to) return null
        return (
          <Polyline key={i}
            positions={[[from.lat, from.lng], [to.lat, to.lng]]}
            color={edge.isBlocked ? "#3b82f6" : "#4b5563"}
            weight={2}
            opacity={0.7}
          />
        )
      })}

      {/* Dijkstra path */}
      {pathCoords.length > 1 && (
        <Polyline
          positions={pathCoords}
          color="#facc15"
          weight={5}
          opacity={0.9}
        />
      )}

      {/* Nodes */}
      {nodes.map(node => (
        <CircleMarker
          key={node.id}
          center={[node.lat, node.lng]}
          radius={12}
          color={getColor(node)}
          fillColor={getColor(node)}
          fillOpacity={0.8}
          eventHandlers={{ click: () => onNodeClick(node.id) }}
        >
          <Popup>
            <strong>{node.label}</strong><br />
            Load: {Math.round(node.load)}%
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}