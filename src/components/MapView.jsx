"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polyline,
  Popup,
  Tooltip,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { fetchRoadPath } from "@/lib/osrm";

function StableView({ center, zoom }) {
  const map = useMap();
  const initialised = useRef(false);
  useEffect(() => {
    if (!initialised.current) {
      map.setView(center, zoom);
      initialised.current = true;
    }
  }, [center, zoom, map]);
  return null;
}

export default function MapView({
  nodes,
  edges,
  path,
  onNodeClick,
  mode,
  theme,
  showEdges = true,
  showNodeLabels = false,
}) {
  const mapRef = useRef(null);
  const [roadCoords, setRoadCoords] = useState([]);

  const straightRoadCoords = useMemo(() => {
    if (path.length < 2 || mode === "traffic" || mode === "disaster") return [];
    return path
      .map((id) => nodes.find((n) => n.id === id))
      .filter(Boolean)
      .map((n) => [n.lat, n.lng]);
  }, [path, nodes, mode]);

  const displayedRoadCoords =
    path.length < 2
      ? []
      : mode === "traffic" || mode === "disaster"
      ? roadCoords
      : straightRoadCoords;

  useEffect(() => {
    if (path.length < 2 || (mode !== "traffic" && mode !== "disaster")) return;
    const waypoints = path
      .map((id) => nodes.find((n) => n.id === id))
      .filter(Boolean)
      .map((n) => [n.lat, n.lng]);
    let active = true;
    fetchRoadPath(waypoints).then((coords) => {
      if (active) setRoadCoords(coords);
    });
    return () => { active = false; };
  }, [path, nodes, mode]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const getNodeColor = (node) => {
    if (node.isBlocked) return "#3b82f6";
    if (node.load > 80) return "#ef4444";
    if (node.load > 60) return "#f97316";
    return "#22c55e";
  };

  const getEdgeStyle = (edge, isOnPath) => {
    if (edge.isBlocked) return { color: "#3b82f6", weight: 2, opacity: 0.85 };
    if (isOnPath)       return { color: "#facc15", weight: 3, opacity: 1 };
    return               { color: "#1a1a1a",   weight: 1.5, opacity: 0.55 };
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: "inherit", overflow: "hidden" }}>
      <MapContainer
        center={[12.97, 77.62]}
        zoom={11}
        style={{ height: "100%", width: "100%" }}
        ref={mapRef}
      >
        <StableView center={[12.97, 77.62]} zoom={11} />

        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* Edges — hidden when showEdges=false (overview mode) */}
        {showEdges && edges.map((edge) => {
          const from = nodes.find((n) => n.id === edge.from);
          const to   = nodes.find((n) => n.id === edge.to);
          if (!from || !to) return null;

          // Edge is "on path" if both its endpoints appear consecutively in path
          const fromIdx = path.indexOf(edge.from);
          const isOnPath = fromIdx !== -1 && path[fromIdx + 1] === edge.to;

          const style = getEdgeStyle(edge, isOnPath);
          return (
            <Polyline
              key={`edge-${edge.from}-${edge.to}-${edge.isBlocked ? 1 : 0}-${isOnPath ? 1 : 0}-${mode}`}
              positions={[[from.lat, from.lng], [to.lat, to.lng]]}
              pathOptions={{
                color:   style.color,
                weight:  style.weight,
                opacity: style.opacity,
              }}
            />
          );
        })}


        {/* Path overlay */}
        {displayedRoadCoords.length >= 2 && (
          <>
            <Polyline
              positions={displayedRoadCoords}
              pathOptions={{ color: "rgba(34,197,94,0.35)", weight: 10, opacity: 1 }}
            />
            <Polyline
              positions={displayedRoadCoords}
              pathOptions={{ color: "#22c55e", weight: 4, opacity: 1 }}
            />
          </>
        )}

        {/* City nodes */}
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
                color:       "#ffffff",
                fillColor:   color,
                fillOpacity: 0.95,
                weight:      2,
              }}
              eventHandlers={{ click: () => onNodeClick(node.id, mode) }}
            >
              {showNodeLabels ? (
                <Tooltip permanent direction="top" offset={[0, -14]} opacity={0.92}>
                  <span style={{ fontSize: 10, fontWeight: 600, whiteSpace: "nowrap", lineHeight: 1.2 }}>
                    {node.label?.split(" ").slice(0, 2).join(" ")}
                  </span>
                </Tooltip>
              ) : (
                <Popup>
                  <strong>{node.label}</strong>
                  <br />
                  {node.isBlocked
                    ? "⚠️ FLOODED — route blocked"
                    : `Load: ${Math.round(node.load)}%`}
                  {isOnPath && (
                    <>
                      <br />
                      <span style={{ color: "#ca8a04" }}>✓ On route</span>
                    </>
                  )}
                </Popup>
              )}
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}