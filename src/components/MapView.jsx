"use client";
import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polyline,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

function StableView({ center, zoom }) {
  const map = useMap();
  const initialised = useRef(false);
  useEffect(() => {
    if (!initialised.current) {
      map.setView(center, zoom);
      initialised.current = true;
    }
  }, []);
  return null;
}

export default function MapView({ nodes, edges, path, onNodeClick }) {
  const pathCoords = path
    .map((id) => nodes.find((n) => n.id === id))
    .filter(Boolean)
    .map((n) => [n.lat, n.lng]);

  const getNodeColor = (node) => {
    if (node.isBlocked) return "#3b82f6";
    if (node.load > 80)  return "#ef4444";
    if (node.load > 60)  return "#f97316";
    return "#22c55e";
  };

  const getEdgeColor = (edge) => {
    if (edge.isBlocked) return "#3b82f6";
    return "#4b5563";
  };

  // A signature string that changes whenever any node's blocked state changes.
  // Used to force-remount CircleMarkers so Leaflet picks up the new colors.
  const blockedSignature = nodes.map((n) => `${n.id}:${n.isBlocked ? 1 : 0}`).join(",");

  // Same for edges
  const edgeSignature = edges.map((e) => `${e.from}-${e.to}:${e.isBlocked ? 1 : 0}`).join(",");

  return (
    <MapContainer
      center={[12.97, 77.62]}
      zoom={11}
      style={{ height: "100%", width: "100%" }}
    >
      <StableView center={[12.97, 77.62]} zoom={11} />

      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      {/* Road edges — key includes blocked state so Leaflet redraws on flood */}
      {edges.map((edge, i) => {
        const from = nodes.find((n) => n.id === edge.from);
        const to   = nodes.find((n) => n.id === edge.to);
        if (!from || !to) return null;
        return (
          <Polyline
            key={`edge-${edge.from}-${edge.to}-${edge.isBlocked ? "blocked" : "open"}-${edgeSignature}`}
            positions={[[from.lat, from.lng], [to.lat, to.lng]]}
            color={getEdgeColor(edge)}
            weight={edge.isBlocked ? 4 : 2}
            opacity={edge.isBlocked ? 0.9 : 0.6}
          />
        );
      })}

      {/* Shortest / evacuation path */}
      {pathCoords.length >= 2 && (
        <Polyline
          key={`path-${path.join("-")}`}
          positions={pathCoords}
          color="#facc15"
          weight={6}
          opacity={1}
        />
      )}

      {/* City nodes — key includes isBlocked + load bucket so Leaflet re-creates
          the marker whenever its visual state changes */}
      {nodes.map((node) => {
        const color    = getNodeColor(node);
        const isOnPath = path.includes(node.id);
        const loadBucket = node.load > 80 ? "hi" : node.load > 60 ? "mid" : "lo";

        return (
          <CircleMarker
            key={`${node.id}-${node.isBlocked ? "blocked" : loadBucket}-${isOnPath ? "path" : "nopath"}-${blockedSignature}`}
            center={[node.lat, node.lng]}
            radius={isOnPath ? 15 : 12}
            pathOptions={{
              color:       isOnPath ? "#facc15" : color,
              fillColor:   color,
              fillOpacity: 0.9,
              weight:      isOnPath ? 3 : 1,
            }}
            eventHandlers={{ click: () => onNodeClick(node.id) }}
          >
            <Popup>
              <strong>{node.label}</strong>
              <br />
              {node.isBlocked
                ? "⚠️ FLOODED — route blocked"
                : `Load: ${Math.round(node.load)}%`}
              {isOnPath && (
                <>
                  <br />
                  <span style={{ color: "#ca8a04" }}>✓ On evacuation route</span>
                </>
              )}
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}