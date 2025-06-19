import { Trackpoint } from "@/lib/database.types"
import {
    Polyline, Pane
} from "react-leaflet";

type GPXPaneProps = {
    trackpoints: Trackpoint[];
}

export default function GPXPane({
    trackpoints
}: GPXPaneProps) {
    const trackPositions = trackpoints.map((point) => [point.lat!, point.lng!] as const);
    return (
        <Pane name="gpx" style={{ zIndex: 400 }}>
        {trackPositions.length > 0 && (
          <Polyline
            positions={trackPositions}
            pathOptions={{
              color: "#3388ff",
              weight: 3,
              opacity: 0.6,
            }}
          />
        )}
      </Pane>
    )
}