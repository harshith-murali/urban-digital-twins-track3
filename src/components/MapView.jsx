"use client";
import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polyline,
  Popup,
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
  }, []);
  return null;
}

export default function MapView({ nodes, edges, path, onNodeClick, mode, theme }) {
  const mapRef = useRef(null);
  const [roadCoords, setRoadCoords] = useState([]);

  useEffect(() => {
    if (path.length < 2) {
      setRoadCoords([]);
      return;
    }

    const waypoints = path
      .map((id) => nodes.find((n) => n.id === id))
      .filter(Boolean)
      .map((n) => [n.lat, n.lng]);

    if (mode === "traffic" || mode === "disaster") {
      fetchRoadPath(waypoints).then(setRoadCoords);
    } else {
      setRoadCoords(waypoints);
    }
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
        color:     edge.isBlocked ? "#3b82f6" : "#facc15",
        weight:    2,
        opacity:   0.7,
        dashArray: "6 4",
      };
    }
    if (mode === "water") {
      return {
        color:     edge.isBlocked ? "#3b82f6" : "#38bdf8",
        weight:    2,
        opacity:   0.7,
        dashArray: "2 3",
      };
    }
    return {
      color:   edge.isBlocked ? "#3b82f6" : "#4b5563",
      weight:  edge.isBlocked ? 4 : 2,
      opacity: edge.isBlocked ? 0.9 : 0.6,
    };
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
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

      {/* Edges */}
      {edges.map((edge) => {
        const from = nodes.find((n) => n.id === edge.from);
        const to   = nodes.find((n) => n.id === edge.to);
        if (!from || !to) return null;
        const style = getEdgeStyle(edge);
        return (
          <>
            <Polyline
              key={`edge-outline-${edge.from}-${edge.to}-${edge.isBlocked ? 1 : 0}-${mode}`}
              positions={[[from.lat, from.lng], [to.lat, to.lng]]}
              pathOptions={{ color: "#ffffff", weight: style.weight + 2, opacity: 0.35, ...(style.dashArray ? { dashArray: style.dashArray } : {}) }}
            />
            <Polyline
              key={`edge-${edge.from}-${edge.to}-${edge.isBlocked ? 1 : 0}-${mode}`}
              positions={[[from.lat, from.lng], [to.lat, to.lng]]}
              pathOptions={{
                color:   style.color,
                weight:  style.weight,
                opacity: style.opacity,
                ...(style.dashArray ? { dashArray: style.dashArray } : {}),
              }}
            />
          </>
        );
      })}

      {/* Path overlay */}
      {roadCoords.length >= 2 && (
        <>
          <Polyline
            key={`path-outline-${path.join("-")}`}
            positions={roadCoords}
            pathOptions={{ color: "#ffffff", weight: 8, opacity: 0.3 }}
          />
          <Polyline
            key={`path-${path.join("-")}`}
            positions={roadCoords}
            pathOptions={{ color: "#facc15", weight: 5, opacity: 1 }}
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
          </CircleMarker>
        );
      })}
    </MapContainer>
      <div style={{
        position: "absolute",
        left: 16,
        bottom: 16,
        padding: "10px 14px",
        background: theme?.dark ? "rgba(18,22,34,0.92)" : "rgba(255,255,255,0.92)",
        borderRadius: 999,
        border: `1px solid ${theme?.bdr ?? "rgba(0,0,0,0.12)"}`,
        display: "flex",
        gap: 10,
        alignItems: "center",
        fontSize: 11,
        color: theme?.txt,
        boxShadow: "0 12px 30px rgba(0,0,0,0.14)",
      }}>
        {[
          { color: "#639922", label: "Clear" },
          { color: "#BA7517", label: "Moderate" },
          { color: "#E24B4A", label: "Congested" },
          { color: "#185FA5", label: "Optimal path" },
        ].map((item) => (
          <span key={item.label} style={{ display: "flex", alignItems: "center", gap: 6, color: theme?.sub, fontSize: 11 }}>
            <span style={{ width: 12, height: 4, background: item.color, borderRadius: 999 }} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}