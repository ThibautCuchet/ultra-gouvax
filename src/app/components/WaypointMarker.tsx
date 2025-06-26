import { Trackpoint, Waypoint } from "@/lib/database.types";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { TrackPoint } from "@/lib/useLiveTrack";
import { findClosestTrackPoint } from "@/lib/calculate";
import { format } from "date-fns";
import { useState } from "react";
import { Check, Copy } from "lucide-react";

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

interface WaypointMarkerProps {
  waypoint: Waypoint;
  validTrackpoints: Trackpoint[];
  liveTrackData?: { trackPoints: TrackPoint[]; sessionId: string };
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
    waypoint.lng == null ||
    waypoint.km == null
  ) {
    return null;
  }

  // Trouver le trackpoint le plus proche du waypoint cible
  const target = findClosestTrackPoint(
    { lat: waypoint.lat, lng: waypoint.lng },
    validTrackpoints
  );
  if (!target || !target.point || target.point.distance_km == null) {
    return null;
  }

  // Trouver le trackpoint le plus proche de la position actuelle du coureur
  const lastLive =
    liveTrackData.trackPoints[liveTrackData.trackPoints.length - 1];
  const current = findClosestTrackPoint(
    { lat: lastLive.position.lat, lng: lastLive.position.lon },
    validTrackpoints
  );
  if (!current || !current.point || current.point.distance_km == null) {
    return null;
  }

  // Calculer la distance restante à parcourir
  const currentDistance = current.point.distance_km;
  const targetDistance = target.point.distance_km;
  const remainingDistance = targetDistance - currentDistance;

  // Si le waypoint est déjà dépassé, ne pas afficher d'ETA
  if (remainingDistance <= 0) {
    return null;
  }

  // Vitesse moyenne : 7:45 min/km = 7.75 minutes par km
  const avgSpeedMinPerKm = 7.75;
  const estimatedTimeMinutes = remainingDistance * avgSpeedMinPerKm;

  // Calculer l'heure d'arrivée estimée
  const now = new Date(lastLive.dateTime);
  const etaDate = new Date(now.getTime() + estimatedTimeMinutes * 60 * 1000);

  return format(etaDate, "HH:mm");
}

export default function WaypointMarker({
  waypoint,
  validTrackpoints,
  liveTrackData,
}: WaypointMarkerProps) {
  const [copiedWaypointId, setCopiedWaypointId] = useState<
    Waypoint["id"] | null
  >(null);

  const eta = getEtaForWaypoint({
    waypoint,
    validTrackpoints,
    liveTrackData,
  });

  const mapsLink =
    waypoint.lat != null && waypoint.lng != null
      ? `geo:${waypoint.lat},${waypoint.lng}`
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
}
