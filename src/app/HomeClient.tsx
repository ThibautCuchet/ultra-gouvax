"use client";

import {
  LiveTrackConfig,
  Step,
  Trackpoint,
  Waypoint,
} from "@/lib/database.types";
import UltraMap from "./components/UltaMap";
import UltraStats from "./components/UltraStats";
import LiveStats from "./components/LiveStats";
import RavitoList from "./components/RavitoList";
import { useLiveTrack } from "@/lib/useLiveTrack";
import { useEffect, useMemo, useState } from "react";
import { findClosestTrackPoint, calculateProgress } from "@/lib/calculate";

interface HomeClientProps {
  waypoints: Waypoint[];
  steps: Step[];
  trackpoints: Trackpoint[];
  liveTrackConfig: LiveTrackConfig | null;
}

export default function HomeClient({
  waypoints,
  steps,
  trackpoints,
  liveTrackConfig,
}: HomeClientProps) {
  // Hook pour les données LiveTrack
  const { 
    data: liveTrackData,
    loading: liveTrackLoading,
    isConnected,
    isFetching,
  } = useLiveTrack(liveTrackConfig?.live_track_url ?? null);

  const [progress, setProgress] = useState(0);

  const validTrackpoints = useMemo(
    () => trackpoints.filter((tp) => tp.lat !== null && tp.lng !== null),
    [trackpoints]
  );

  useEffect(() => {
    if (!liveTrackData?.trackPoints?.length || validTrackpoints.length === 0) {
      return;
    }

    const lastPoint =
      liveTrackData.trackPoints[liveTrackData.trackPoints.length - 1];
    const closest = findClosestTrackPoint(
      { lat: lastPoint.position.lat, lng: lastPoint.position.lon },
      validTrackpoints
    );
    if (closest) {
      setProgress(calculateProgress(closest.index, validTrackpoints.length));
    }
  }, [liveTrackData, validTrackpoints]);

  const totalDistance = steps.reduce(
    (acc, step) => acc + (step.distance_km ?? 0),
    0
  );

  const totalElevation = steps.reduce(
    (acc, step) => acc + (step.elevation_gain_m ?? 0),
    0
  );

  const ravitos = waypoints.filter((wp) => wp.is_ravito);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <header className="text-center">
          <h1 className="text-4xl font-bold text-primary mb-2">
            🏃‍♂️ Ultra Hoeilaart-Gouvy
          </h1>
          <p className="text-xl text-muted-foreground">
            Suivi en temps réel de Charles
          </p>
          <div className="flex items-center justify-center gap-4 mt-4 text-sm text-muted-foreground">
            <div>📍 {totalDistance.toFixed(2)} km</div>
            <div>⛰️ {totalElevation.toFixed(0)}m D+</div>
            <div>🕒 {steps.length} étapes</div>
          </div>
        </header>

        <UltraStats progress={progress} />

        <div>
          <h2 className="text-2xl font-semibold mb-4">🗺️ Carte en temps réel</h2>
          <div className="w-full h-[28rem] sm:h-[32rem] rounded-lg overflow-hidden border relative">
            <UltraMap
              waypoints={waypoints}
              trackpoints={trackpoints}
              liveTrackData={liveTrackData || undefined}
              isConnected={isConnected}
              liveTrackLoading={liveTrackLoading}
              isFetching={isFetching}
            />
          </div>
        </div>

        <LiveStats
          fitnessData={
            liveTrackData?.trackPoints?.[
              liveTrackData.trackPoints.length - 1
            ]?.fitnessPointData
          }
          isConnected={isConnected}
          loading={liveTrackLoading}
          isFetching={isFetching}
        />

        <RavitoList
          ravitos={ravitos}
          trackpoints={trackpoints}
          liveTrackData={liveTrackData || undefined}
        />

        <footer className="text-center text-sm text-muted-foreground border-t pt-8">
          <p>
            🚀 Application de suivi ultra créée avec Next.js, Leaflet et
            beaucoup d&apos;amour
          </p>
          <p className="mt-2">💪 Allez Charles ! Tu peux le faire !</p>
        </footer>
      </div>
    </div>
  );
}
