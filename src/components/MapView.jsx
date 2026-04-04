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
  // ── Cleanup ref: destroy Leaflet instance on unmount ─────────────────────
  // Prevents "Map container is being reused by another instance" on hot-reload
  const mapRef = useRef(null);
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

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

  return (
    <MapContainer
      center={[12.97, 77.62]}
      zoom={11}
      style={{ height: "100%", width: "100%" }}
      // ── Store the Leaflet map instance so we can remove() it on unmount ──
      ref={mapRef}
    >
      <StableView center={[12.97, 77.62]} zoom={11} />

      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      {/* Road edges ─────────────────────────────────────────────────────── */}
      {/* Key only uses the edge's own blocked state — not the whole graph signature.
          Changing one edge no longer remounts every other edge. */}
      {edges.map((edge) => {
        const from = nodes.find((n) => n.id === edge.from);
        const to   = nodes.find((n) => n.id === edge.to);
        if (!from || !to) return null;
        return (
          <Polyline
            key={`edge-${edge.from}-${edge.to}-${edge.isBlocked ? 1 : 0}`}
            positions={[[from.lat, from.lng], [to.lat, to.lng]]}
            color={getEdgeColor(edge)}
            weight={edge.isBlocked ? 4 : 2}
            opacity={edge.isBlocked ? 0.9 : 0.6}
          />
        );
      })}

      {/* Shortest / evacuation path ─────────────────────────────────────── */}
      {pathCoords.length >= 2 && (
        <Polyline
          key={`path-${path.join("-")}`}
          positions={pathCoords}
          color="#facc15"
          weight={6}
          opacity={1}
        />
      )}

      {/* City nodes ──────────────────────────────────────────────────────── */}
      {/* Key only contains THIS node's own state — not the whole graph signature.
          One node flooding no longer remounts every other marker. */}
      {nodes.map((node) => {
        const color      = getNodeColor(node);
        const isOnPath   = path.includes(node.id);
        const loadBucket = node.load > 80 ? "hi" : node.load > 60 ? "mid" : "lo";

        return (
          <CircleMarker
            key={`${node.id}-${node.isBlocked ? 1 : 0}-${loadBucket}-${isOnPath ? 1 : 0}`}
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