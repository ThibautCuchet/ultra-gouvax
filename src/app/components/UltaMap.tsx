"use client";

import { Trackpoint, Waypoint } from "@/lib/database.types";
import { MapContainer, Marker, TileLayer, Polyline } from "react-leaflet";
import L from "leaflet";

// Simple emoji based icon generator
const createEmojiIcon = (emoji: string, size: [number, number] = [30, 30]) => {
  return L.divIcon({
    html: `<div style="font-size:${size[0]}px;">${emoji}</div>`,
    iconSize: size,
    className: "",
    iconAnchor: [size[0] / 2, size[1]], // Ancré au centre horizontalement et en bas verticalement
    popupAnchor: [0, -size[1]],
  });
};

interface UltraMapProps {
  waypoints: Waypoint[];
  trackpoints: Trackpoint[];
}

export default function UltraMap({ waypoints, trackpoints }: UltraMapProps) {
  // Convertir les trackpoints en positions pour la polyline
  const validTrackpoints = trackpoints.filter(
    (trackpoint) => trackpoint.lat && trackpoint.lng
  );
  const trackPositions = validTrackpoints.map(
    (trackpoint) => [trackpoint.lat!, trackpoint.lng!] as [number, number]
  );

  // Points de départ et d'arrivée
  const startPoint = validTrackpoints[0];
  const endPoint = validTrackpoints[validTrackpoints.length - 1];

  return (
    <MapContainer
      center={[50.6, 4.8]}
      zoom={9}
      scrollWheelZoom={true}
      className="w-full h-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Tracé GPX avec une polyline */}
      {trackPositions.length > 0 && (
        <Polyline
          positions={trackPositions}
          pathOptions={{
            color: "#3388ff",
            weight: 4,
            opacity: 0.8,
          }}
        />
      )}

      {/* Marqueur de départ */}
      {startPoint && (
        <Marker
          position={[startPoint.lat!, startPoint.lng!]}
          icon={createEmojiIcon("🚩")}
        />
      )}

      {/* Marqueur d'arrivée */}
      {endPoint && startPoint !== endPoint && (
        <Marker
          position={[endPoint.lat!, endPoint.lng!]}
          icon={createEmojiIcon("🏁")}
        />
      )}

      {/* Waypoints avec des markers */}
      {waypoints.map((waypoint) => (
        <Marker
          key={waypoint.id}
          position={[waypoint.lat ?? 0, waypoint.lng ?? 0]}
          icon={createEmojiIcon("📍")}
        />
      ))}
    </MapContainer>
  );
}
