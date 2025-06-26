"use client";

import { Trackpoint, Waypoint } from "@/lib/database.types";
import { MapContainer, Marker, TileLayer, Pane, Popup } from "react-leaflet";
import L from "leaflet";
import { TrackPoint } from "@/lib/useLiveTrack";
import WaypointMarker from "./WaypointMarker";
import LiveTrackPane from "./panes/LiveTrackPane";
import UserLocationLayer from "./UserLocationLayer";
import GPXPane from "./panes/GPXPane";

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

const formatSpeed = (metersPerSec: number) => {
  const kmh = metersPerSec * 3.6;
  return `${kmh.toFixed(1)} km/h`;
};

interface UltraMapProps {
  waypoints: Waypoint[];
  trackpoints: Trackpoint[];
  liveTrackData?: {
    trackPoints: TrackPoint[];
    sessionId: string;
  };
  isConnected?: boolean;
  liveTrackLoading?: boolean;
  isFetching?: boolean;
}

export default function UltraMap({
  waypoints,
  trackpoints,
  liveTrackData,
  isConnected = false,
  liveTrackLoading = false,
  isFetching = false,
}: UltraMapProps) {
  // Convertir les trackpoints en positions pour la polyline
  const validTrackpoints = trackpoints.filter(
    (trackpoint) => trackpoint.lat && trackpoint.lng
  );

  const trackPositions = validTrackpoints.map(
    (trackpoint) => [trackpoint.lat!, trackpoint.lng!] as [number, number]
  );

  const startPoint = trackPositions.at(0);
  const endPoint = trackPositions.at(-1);

  // Position actuelle (dernier point des données LiveTrack)
  const currentPosition = liveTrackData?.trackPoints?.length
    ? liveTrackData.trackPoints[liveTrackData.trackPoints.length - 1]
    : null;

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

      {/* Tracé GPX historique */}
      <GPXPane trackpoints={trackpoints} />

      {/* Tracé en temps réel */}
      <LiveTrackPane liveTrackData={liveTrackData} />

      {/* Indicateur de statut LiveTrack */}
      {liveTrackData && (
        <div className="absolute top-4 right-4 z-[1000] bg-white p-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected
                  ? isFetching
                    ? "bg-yellow-500 animate-pulse"
                    : "bg-green-500"
                  : liveTrackLoading
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
            />
            <span className="text-sm font-medium">
              {isConnected
                ? isFetching
                  ? "Mise à jour..."
                  : "Live"
                : liveTrackLoading
                ? "Connexion..."
                : "Déconnecté"}
            </span>
          </div>
        </div>
      )}

      <Pane name="waypoints" style={{ zIndex: 420 }}>
        {/* Marqueur de départ */}
        {startPoint && (
          <Marker position={startPoint} icon={createEmojiIcon("🚩")} />
        )}

        {/* Marqueur d'arrivée */}
        {endPoint && startPoint !== endPoint && (
          <Marker position={endPoint} icon={createEmojiIcon("🏁")} />
        )}

        {/* Waypoints */}
        {waypoints.map((waypoint) => (
          <WaypointMarker
            key={waypoint.id}
            waypoint={waypoint}
            validTrackpoints={validTrackpoints}
            liveTrackData={liveTrackData}
          />
        ))}
      </Pane>

      <Pane name="liveTrackPoint" style={{ zIndex: 430 }}>
        {/* Position actuelle en temps réel */}
        {currentPosition && (
          <Marker
            position={[
              currentPosition.position.lat,
              currentPosition.position.lon,
            ]}
            icon={createEmojiIcon("🏃‍➡️")}
          >
            <Popup>
              <div className="space-y-1 text-sm">
                <div>
                  🏃{" "}
                  {formatSpeed(
                    currentPosition.fitnessPointData.speedMetersPerSec
                  )}
                </div>
                <div>
                  ❤️ {currentPosition.fitnessPointData.heartRateBeatsPerMin} bpm
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </Pane>

      {/* Localisation de l'utilisateur */}
      <UserLocationLayer />
    </MapContainer>
  );
}
