"use client";

import { Pane, Polyline } from "react-leaflet";
import { TrackPoint } from "@/lib/useLiveTrack";

type LiveTrackPaneProps = {
  liveTrackData?: {
    trackPoints: TrackPoint[];
    sessionId: string;
  };
};

export default function LiveTrackPane({
    liveTrackData
}: LiveTrackPaneProps) {
    const liveTrackPositions =
        liveTrackData?.trackPoints?.map(
          (point: TrackPoint) =>
            [point.position.lat, point.position.lon] as [number, number]
        ) || [];

    return (
        <Pane name="liveTrack" style={{ zIndex: 410 }}>
                {liveTrackPositions.length > 0 && (
                  <Polyline
                    positions={liveTrackPositions}
                    pathOptions={{
                      color: "#ff4444",
                      weight: 4,
                      opacity: 0.9,
                    }}
                  />
                )}
        </Pane>
    )
}
