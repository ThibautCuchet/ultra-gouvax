"use client";

import { Marker, Popup, Pane } from "react-leaflet";
import L from "leaflet";
import { useShareLocation } from "@/lib/useShareLocation";

const createOtherIcon = (size = 12) => {
  const style = [
    "background:#e11d48",
    `width:${size}px`,
    `height:${size}px`,
    "border-radius:50%",
    "box-shadow:0 0 0 2px white,0 0 6px 2px rgba(225,29,72,0.5)",
  ].join(";");
  return L.divIcon({
    html: `<div style="${style}"></div>`,
    iconSize: [size, size],
    className: "",
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

export default function SharedLocationsLayer({
  enabled,
}: {
  enabled: boolean;
}) {
  const { locations, userId } = useShareLocation(enabled);

  return (
    <Pane name="sharedLocations" style={{ zIndex: 435 }}>
      {Object.entries(locations).map(([id, pos]) => {
        if (id === userId) return null;
        return (
          <Marker
            key={id}
            position={[pos.lat, pos.lng]}
            icon={createOtherIcon()}
          >
            <Popup>Autre utilisateur</Popup>
          </Marker>
        );
      })}
    </Pane>
  );
}
