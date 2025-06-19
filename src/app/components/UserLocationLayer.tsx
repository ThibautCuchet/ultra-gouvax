"use client";

import { Marker, Popup, Pane } from "react-leaflet";
import L from "leaflet";
import { useCurrentLocation } from "@/lib/useCurrentLocation";

const createEmojiIcon = (emoji: string, size: [number, number] = [20, 20]) => {
  return L.divIcon({
    html: `<div style="font-size:${size[0]}px;">${emoji}</div>`,
    iconSize: size,
    className: "",
    iconAnchor: [size[0] / 2, size[1]],
    popupAnchor: [0, -size[1]],
  });
};

export default function UserLocationLayer() {
  const { position } = useCurrentLocation();

  if (!position) return null;

  return (
    <Pane name="userLocation" style={{ zIndex: 440 }}>
      <Marker
        position={[position.lat, position.lng]}
        icon={createEmojiIcon("🧍", [20, 20])}
      >
        <Popup>Vous êtes ici</Popup>
      </Marker>
    </Pane>
  );
}
