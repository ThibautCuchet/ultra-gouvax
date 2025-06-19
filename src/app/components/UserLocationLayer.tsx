"use client";

import { Marker, Popup, Pane } from "react-leaflet";
import L from "leaflet";
import { useCurrentLocation } from "@/lib/useCurrentLocation";

const createBlueDotIcon = (size = 12) => {
  const style = [
    "background:#007aff",
    `width:${size}px`,
    `height:${size}px`,
    "border-radius:50%",
    "box-shadow:0 0 0 2px white,0 0 6px 2px rgba(0,122,255,0.5)",
  ].join(";");

  return L.divIcon({
    html: `<div style="${style}"></div>`,
    iconSize: [size, size],
    className: "",
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

export default function UserLocationLayer() {
  const { position } = useCurrentLocation();

  if (!position) return null;

  return (
    <Pane name="userLocation" style={{ zIndex: 440 }}>
      <Marker
        position={[position.lat, position.lng]}
        icon={createBlueDotIcon()}
      >
        <Popup>Vous êtes ici</Popup>
      </Marker>
    </Pane>
  );
}
