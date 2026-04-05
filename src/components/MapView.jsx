"use client";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
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

  const getEdgeStyle = (edge) => {
    if (mode === "energy") {
      return {
        color:        edge.isBlocked ? "#3b82f6" : "#facc15",
        weight:       edge.isBlocked ? 4 : 3,
        opacity:      edge.isBlocked ? 1 : 0.95,
        dashArray:    edge.isBlocked ? null : "8 3",
        outlineColor: edge.isBlocked ? "rgba(59,130,246,0.35)" : "rgba(250,204,21,0.35)",
        outlineWeight: edge.isBlocked ? 7 : 8,
      };
    }
    if (mode === "water") {
      return {
        color:        edge.isBlocked ? "#3b82f6" : "#38bdf8",
        weight:       3,
        opacity:      0.9,
        dashArray:    "2 3",
        outlineColor: edge.isBlocked ? "rgba(59,130,246,0.35)" : "rgba(56,189,248,0.35)",
        outlineWeight: 8,
      };
    }
    return {
      color:   edge.isBlocked ? "#3b82f6" : "#4b5563",
      weight:  edge.isBlocked ? 4 : 2,
      opacity: edge.isBlocked ? 0.9 : 0.6,
    };
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
          const style = getEdgeStyle(edge);
          const outlineColor   = style.outlineColor  ?? "#ffffff";
          const outlineWeight  = style.outlineWeight ?? (style.weight + 2);
          const outlineOpacity = style.outlineColor ? 1 : 0.35;
          return (
            <Fragment key={`edge-${edge.from}-${edge.to}-${edge.isBlocked ? 1 : 0}-${mode}`}>
              <Polyline
                positions={[[from.lat, from.lng], [to.lat, to.lng]]}
                pathOptions={{ color: outlineColor, weight: outlineWeight, opacity: outlineOpacity, ...(style.dashArray ? { dashArray: style.dashArray } : {}) }}
              />
              <Polyline
                positions={[[from.lat, from.lng], [to.lat, to.lng]]}
                pathOptions={{
                  color:   style.color,
                  weight:  style.weight,
                  opacity: style.opacity,
                  ...(style.dashArray ? { dashArray: style.dashArray } : {}),
                }}
              />
            </Fragment>
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