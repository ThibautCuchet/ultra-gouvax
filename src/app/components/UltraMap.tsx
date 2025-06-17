import dynamic from "next/dynamic";
import type { WayPoint, TrackPoint, LivePosition } from "@/lib/types";
import { STAGES } from "@/lib/types";
import { getTrackPoints } from "@/lib/dataParser";

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
  waypoints: WayPoint[];
}

export default async function UltraMap({
  livePosition,
  waypoints,
}: UltraMapProps) {
  const stageTracks: Record<number, TrackPoint[]> = {};
  for (const stage of STAGES) {
    stageTracks[stage.id] = await getTrackPoints(stage.gpxFile);
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
