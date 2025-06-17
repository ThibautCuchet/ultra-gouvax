import type { WayPoint, TrackPoint, LivePosition } from "@/lib/types";
import { STAGES } from "@/lib/types";
import { getTrackPoints } from "@/lib/dataParser";
import MapComponent from "./MapComponent";

interface UltraMapProps {
  waypoints: WayPoint[];
}

export default async function UltraMap({ waypoints }: UltraMapProps) {
  const stageTracks: Record<number, TrackPoint[]> = {};
  for (const stage of STAGES) {
    stageTracks[stage.id] = await getTrackPoints(stage.gpxFile);
  }

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden border">
      <MapComponent waypoints={waypoints} stageTracks={stageTracks} />
    </div>
  );
}
