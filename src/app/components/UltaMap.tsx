"use client";

import { Trackpoint, Waypoint } from "@/lib/database.types";
import {
  MapContainer,
  Marker,
  TileLayer,
  Popup,
  Pane,
} from "react-leaflet";
import L from "leaflet";
import { TrackPoint } from "@/lib/useLiveTrack";
import { findClosestTrackPoint } from "@/lib/calculate";
import { format } from "date-fns";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import UserLocationLayer from "./UserLocationLayer";
import SharedLocationsLayer from "./SharedLocationsLayer";
import GPXPane from "./panes/GPXPane";
import LiveTrackPane from "./panes/LiveTrackPane";

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
  shareEnabled?: boolean;
}

function getEtaForWaypoint({
  waypoint,
  validTrackpoints,
  liveTrackData,
}: {
  waypoint: Waypoint;
  validTrackpoints: Trackpoint[];
  liveTrackData?: { trackPoints: TrackPoint[]; sessionId: string };
}): string | null {
  if (
    !liveTrackData ||
    liveTrackData.trackPoints.length === 0 ||
    waypoint.lat == null ||
    waypoint.lng == null
  ) {
    return null;
  }

  const target = findClosestTrackPoint(
    { lat: waypoint.lat, lng: waypoint.lng },
    validTrackpoints
  );
  if (!target || !target.point.time) {
    return null;
  }

  const lastLive =
    liveTrackData.trackPoints[liveTrackData.trackPoints.length - 1];
  const current = findClosestTrackPoint(
    { lat: lastLive.position.lat, lng: lastLive.position.lon },
    validTrackpoints
  );
  if (!current || !current.point.time) {
    return null;
  }

  const scheduledCurrent = new Date(current.point.time).getTime();
  const scheduledTarget = new Date(target.point.time).getTime();
  const actualCurrent = new Date(lastLive.dateTime).getTime();

  const offset = actualCurrent - scheduledCurrent;
  const etaDate = new Date(scheduledTarget + offset);
  return format(etaDate, "HH:mm");
}

export default function UltraMap({
  waypoints,
  trackpoints,
  liveTrackData,
  isConnected = false,
  liveTrackLoading = false,
  isFetching = false,
  shareEnabled = false,
}: UltraMapProps) {
  const [copiedWaypointId, setCopiedWaypointId] =
    useState<Waypoint["id"] | null>(null);
  // Convertir les trackpoints en positions pour la polyline
  const validTrackpoints = trackpoints.filter(
    (trackpoint) => trackpoint.lat && trackpoint.lng
  );

  const trackPositions = validTrackpoints.map(
    (trackpoint) => [trackpoint.lat!, trackpoint.lng!] as [number, number]
  );

  // Convertir les données LiveTrack en positions

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
          <Marker
            position={startPoint}
            icon={createEmojiIcon("🚩")}
          />
        )}

        {/* Marqueur d'arrivée */}
        {endPoint && startPoint !== endPoint && (
          <Marker
            position={endPoint}
            icon={createEmojiIcon("🏁")}
          />
        )}

        {/* Waypoints avec des markers */}
        {waypoints.map((waypoint) => {
          const eta = getEtaForWaypoint({
            waypoint,
            validTrackpoints,
            liveTrackData,
          });
          const mapsLink =
            waypoint.lat != null && waypoint.lng != null
              ? `https://www.google.com/maps/dir/?api=1&destination=${waypoint.lat},${waypoint.lng}`
              : null;
          return (
            <Marker
              key={waypoint.id}
              position={[waypoint.lat ?? 0, waypoint.lng ?? 0]}
              icon={createEmojiIcon(
                waypoint.is_ravito ? "🥤" : "📍",
                waypoint.is_ravito ? [30, 30] : [20, 20]
              )}
            >
              <Popup>
                <div className="space-y-1 text-sm">
                  {waypoint.name && (
                    <div className="font-semibold">{waypoint.name}</div>
                  )}
                  {waypoint.km !== null && <div>{waypoint.km} km</div>}
                  {eta && <div>ETA : {eta}</div>}
                  {mapsLink && (
                    <div className="pt-1 space-y-1">
                      <a
                        href={mapsLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 underline"
                      >
                        <span>🗺️</span> Itinéraire
                      </a>
                      <div className="flex items-center gap-1">
                        <span>
                          {waypoint.lat?.toFixed(5)}, {waypoint.lng?.toFixed(5)}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `${waypoint.lat},${waypoint.lng}`
                            );
                            setCopiedWaypointId(waypoint.id);
                            setTimeout(() => setCopiedWaypointId(null), 1500);
                          }}
                          className="text-blue-600"
                          aria-label="Copier les coordonnées"
                        >
                          {copiedWaypointId === waypoint.id ? (
                            <Check className="w-4 h-4 text-green-600 animate-bounce" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        {copiedWaypointId === waypoint.id && (
                          <span className="text-green-600 text-xs">Copié !</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
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
                  🏃 {formatSpeed(currentPosition.fitnessPointData.speedMetersPerSec)}
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

      {/* Localisations partagées des autres utilisateurs */}
      <SharedLocationsLayer enabled={shareEnabled} />
    </MapContainer>
  );
}
