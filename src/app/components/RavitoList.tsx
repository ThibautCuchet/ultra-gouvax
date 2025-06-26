"use client";

import { Waypoint, Trackpoint } from "@/lib/database.types";
import { TrackPoint } from "@/lib/useLiveTrack";
import { findClosestTrackPoint } from "@/lib/calculate";
import { format } from "date-fns";

interface RavitoListProps {
  ravitos: Waypoint[];
  trackpoints: Trackpoint[];
  liveTrackData?: {
    trackPoints: TrackPoint[];
    sessionId: string;
  };
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

export default function RavitoList({
  ravitos,
  trackpoints,
  liveTrackData,
}: RavitoListProps) {
  const validTrackpoints = trackpoints.filter(
    (tp) => tp.lat !== null && tp.lng !== null
  );

  return (
    <div className="bg-card p-6 rounded-lg border space-y-4">
      <h2 className="text-xl font-bold">🥤 Ravitos</h2>
      <ul className="space-y-3">
        {ravitos.map((ravito) => {
          const eta = getEtaForWaypoint({
            waypoint: ravito,
            validTrackpoints,
            liveTrackData,
          });
          const mapsLink =
            ravito.lat != null && ravito.lng != null
              ? `https://www.google.com/maps/dir/?api=1&destination=${ravito.lat},${ravito.lng}`
              : null;
          return (
            <li key={ravito.id} className="flex items-center justify-between">
              <div>
                <div className="font-medium">{ravito.name}</div>
                <div className="text-sm text-muted-foreground">
                  {ravito.km != null && `${ravito.km} km`}
                  {eta && ` · ETA ${eta}`}
                </div>
              </div>
              {mapsLink && (
                <a
                  href={mapsLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline"
                >
                  🗺️
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
