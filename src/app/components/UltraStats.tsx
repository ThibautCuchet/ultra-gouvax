"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { WayPoint, LivePosition, ETACalculation } from "@/lib/types";
import { STAGES } from "@/lib/types";
import { calculateDistance } from "@/lib/dataParser";

interface UltraStatsProps {
  waypoints: WayPoint[];
  livePosition?: LivePosition;
}

export default function UltraStats({
  waypoints,
  livePosition,
}: UltraStatsProps) {
  const [etas, setEtas] = useState<ETACalculation[]>([]);
  const [totalProgress, setTotalProgress] = useState<number>(0);

  useEffect(() => {
    if (!livePosition || waypoints.length === 0) return;

    // Calculate ETAs based on average speed and current position
    const avgSpeed = 12; // km/h - can be dynamic based on actual speed
    const newEtas: ETACalculation[] = [];

    for (const waypoint of waypoints) {
      const distance = calculateDistance(
        livePosition.lat,
        livePosition.lng,
        waypoint.lat,
        waypoint.lng
      );

      const timeToReach = distance / avgSpeed; // hours
      const eta = new Date(
        livePosition.timestamp.getTime() + timeToReach * 60 * 60 * 1000
      );

      newEtas.push({
        waypoint,
        eta,
        distance,
        progress: Math.max(0, 100 - (distance / 150) * 100), // Rough progress calculation
      });
    }

    setEtas(newEtas);

    // Calculate total progress (rough estimate)
    const totalDistance = 150; // km
    const distanceFromStart = calculateDistance(
      STAGES[0].startCoords[0],
      STAGES[0].startCoords[1],
      livePosition.lat,
      livePosition.lng
    );
    setTotalProgress(Math.min(100, (distanceFromStart / totalDistance) * 100));
  }, [livePosition, waypoints]);

  const ravitoPoints = waypoints.filter((wp) => wp.isRavito);
  const nextRavito = ravitoPoints.find((wp) => {
    if (!livePosition) return true;
    const distance = calculateDistance(
      livePosition.lat,
      livePosition.lng,
      wp.lat,
      wp.lng
    );
    return distance > 0.5; // Next ravito is more than 500m away
  });

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <div className="bg-card p-6 rounded-lg border">
        <h2 className="text-xl font-bold mb-4">🏃 Ultra Hoeilaart-Gouvy</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Progression totale</span>
              <span className="text-sm text-muted-foreground">
                {totalProgress.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className="bg-primary h-3 rounded-full transition-all duration-500"
                style={{ width: `${totalProgress}%` }}
              />
            </div>
          </div>

          {livePosition && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Position:</span>
                <div className="font-mono">
                  {livePosition.lat.toFixed(5)}, {livePosition.lng.toFixed(5)}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Dernière maj:</span>
                <div>
                  {format(livePosition.timestamp, "HH:mm:ss", { locale: fr })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stages */}
      <div className="bg-card p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">🗺️ Étapes</h3>
        <div className="space-y-3">
          {STAGES.map((stage) => (
            <div key={stage.id} className="p-3 rounded-lg border bg-muted/50">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{stage.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {stage.start} → {stage.end}
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div>{stage.distance} km</div>
                  <div className="text-muted-foreground">
                    D+{stage.elevation}m
                  </div>
                </div>
              </div>
              {stage.description && (
                <div className="text-xs text-muted-foreground mt-2">
                  {stage.description}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Next Ravito */}
      {nextRavito && (
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">🥤 Prochain Ravito</h3>
          <div className="space-y-2">
            <div className="font-medium">{nextRavito.name}</div>
            <div className="text-sm text-muted-foreground">
              Km {nextRavito.km}
            </div>
            {livePosition && (
              <div className="text-sm">
                Distance:{" "}
                {calculateDistance(
                  livePosition.lat,
                  livePosition.lng,
                  nextRavito.lat,
                  nextRavito.lng
                ).toFixed(1)}{" "}
                km
              </div>
            )}
          </div>
        </div>
      )}

      {/* ETAs for Ravito points */}
      {etas.length > 0 && (
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">⏰ ETAs Ravitos</h3>
          <div className="space-y-2">
            {etas
              .filter((eta) => eta.waypoint.isRavito)
              .slice(0, 3)
              .map((eta) => (
                <div
                  key={eta.waypoint.name}
                  className="flex justify-between items-center py-2 border-b last:border-b-0"
                >
                  <div>
                    <div className="font-medium text-sm">
                      {eta.waypoint.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Km {eta.waypoint.km}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono">
                      {format(eta.eta, "HH:mm", { locale: fr })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {eta.distance.toFixed(1)} km
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
