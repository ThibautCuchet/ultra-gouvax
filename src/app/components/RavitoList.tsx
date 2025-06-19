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

  const lastLive = liveTrackData.trackPoints[liveTrackData.trackPoints.length - 1];
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
              ? `geo:${ravito.lat},${ravito.lng}`
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
