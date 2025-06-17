"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { WayPoint, TrackPoint, LivePosition } from "@/lib/types";
import { STAGES } from "@/lib/types";
import { parseCSVData } from "@/lib/dataParser";

// Dynamic import for the entire map component to avoid SSR issues
const DynamicMap = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96 bg-muted rounded-lg">
      <div className="text-muted-foreground">Chargement de la carte...</div>
    </div>
  ),
});

interface UltraMapProps {
  livePosition?: LivePosition;
}

export default function UltraMap({ livePosition }: UltraMapProps) {
  const [waypoints, setWaypoints] = useState<WayPoint[]>([]);
  const [stageTracks, setStageTracks] = useState<Map<number, TrackPoint[]>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Load waypoints
        const wayPointsData = await parseCSVData();
        setWaypoints(wayPointsData);

        // Load GPX tracks for all stages
        const tracks = new Map<number, TrackPoint[]>();
        for (const stage of STAGES) {
          try {
            const response = await fetch(
              `/api/gpx/${encodeURIComponent(stage.gpxFile)}`
            );
            const trackData = await response.json();
            tracks.set(stage.id, trackData);
          } catch (error) {
            console.error(`Error loading track for stage ${stage.id}:`, error);
          }
        }
        setStageTracks(tracks);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-muted rounded-lg">
        <div className="text-muted-foreground">Chargement de la carte...</div>
      </div>
    );
  }

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden border">
      <DynamicMap
        waypoints={waypoints}
        stageTracks={stageTracks}
        livePosition={livePosition}
      />
    </div>
  );
}
