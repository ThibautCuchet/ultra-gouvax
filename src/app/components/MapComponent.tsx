"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import type { WayPoint, TrackPoint, LivePosition } from "@/lib/types";
import { calculateDistance } from "@/lib/dataParser";

// Simple emoji based icon generator
const createEmojiIcon = (emoji: string, size: [number, number] = [30, 30]) => {
  return L.divIcon({
    html: `<div style="font-size:${size[0]}px;">${emoji}</div>`,
    iconSize: size,
    className: "",
    iconAnchor: [size[0] / 2, size[1] / 2],
    popupAnchor: [0, -size[1] / 2],
  });
};

interface MapComponentProps {
  waypoints: WayPoint[];
  stageTracks: Map<number, TrackPoint[]>;
  livePosition?: LivePosition;
}

export default function MapComponent({
  waypoints,
  stageTracks,
  livePosition,
}: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const polylinesRef = useRef<L.Polyline[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize the map
    const map = L.map(mapContainerRef.current, {
      center: [50.6, 4.8],
      zoom: 9,
      scrollWheelZoom: true,
    });

    // Add tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    mapRef.current = map;

    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers when waypoints change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      mapRef.current?.removeLayer(marker);
    });
    markersRef.current = [];

    // Average speed in km/h (approx. 8 min per km)
    const AVG_SPEED = 7.5;

    // Add waypoint markers
    waypoints.forEach((waypoint) => {
      const icon = waypoint.isRavito
        ? createEmojiIcon("🥤", [28, 28])
        : createEmojiIcon("📍", [24, 24]);

      let popupContent = `<div class="p-2">`;
      popupContent += `<h3 class="font-semibold ${
        waypoint.isRavito ? "text-red-600" : "text-blue-600"
      }">${waypoint.name}</h3>`;
      popupContent += `<p class="text-sm text-gray-600">Km ${waypoint.km} ${
        waypoint.isRavito ? "🥤 RAVITO" : "📍"
      }</p>`;

      if (livePosition) {
        const distance = calculateDistance(
          livePosition.lat,
          livePosition.lng,
          waypoint.lat,
          waypoint.lng
        );
        const eta = new Date(
          livePosition.timestamp.getTime() + (distance / AVG_SPEED) * 3600000
        );
        popupContent += `<p class="text-sm mt-1">ETA: ${eta.toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}</p>`;
      }

      const googleLink = `https://www.google.com/maps/dir/?api=1&destination=${waypoint.lat},${waypoint.lng}`;
      const wazeLink = `https://www.waze.com/ul?ll=${waypoint.lat},${waypoint.lng}&navigate=yes`;
      popupContent += `<div class="flex gap-2 mt-2 text-sm"><a href="${googleLink}" target="_blank" rel="noopener" class="underline">Google Maps</a><a href="${wazeLink}" target="_blank" rel="noopener" class="underline">Waze</a></div>`;
      popupContent += `</div>`;

      const marker = L.marker([waypoint.lat, waypoint.lng], { icon })
        .bindPopup(popupContent)
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });

    // Add live position marker if available
    if (livePosition) {
      const liveIcon = createEmojiIcon("🏃", [30, 30]);
      const googleLink = `https://www.google.com/maps/dir/?api=1&destination=${livePosition.lat},${livePosition.lng}`;
      const wazeLink = `https://www.waze.com/ul?ll=${livePosition.lat},${livePosition.lng}&navigate=yes`;
      const popup = `
          <div class="p-2">
            <h3 class="font-semibold text-green-600">🏃 Charles</h3>
            <p class="text-sm text-gray-600">Position actuelle</p>
            ${livePosition.speed ? `<p class="text-sm">Vitesse: ${livePosition.speed.toFixed(1)} km/h</p>` : ""}
            <div class="flex gap-2 mt-2 text-sm"><a href="${googleLink}" target="_blank" rel="noopener" class="underline">Google Maps</a><a href="${wazeLink}" target="_blank" rel="noopener" class="underline">Waze</a></div>
          </div>
        `;

      const liveMarker = L.marker([livePosition.lat, livePosition.lng], {
        icon: liveIcon,
      })
        .bindPopup(popup)
        .addTo(mapRef.current!);

      markersRef.current.push(liveMarker);
    }
  }, [waypoints, livePosition]);

  // Update polylines when stage tracks change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing polylines
    polylinesRef.current.forEach((polyline) => {
      mapRef.current?.removeLayer(polyline);
    });
    polylinesRef.current = [];

    const stageColors = [
      "#ff4444",
      "#ff8844",
      "#ffaa44",
      "#88ff44",
      "#44ff88",
      "#4488ff",
    ];

    // Add stage tracks
    Array.from(stageTracks.entries()).forEach(([stageId, track]) => {
      if (track.length > 0) {
        const polyline = L.polyline(
          track.map((point) => [point.lat, point.lng]),
          {
            color: stageColors[stageId - 1] || "#444444",
            weight: 3,
            opacity: 0.8,
          }
        ).addTo(mapRef.current!);

        polylinesRef.current.push(polyline);
      }
    });
  }, [stageTracks]);

  return (
    <div
      ref={mapContainerRef}
      style={{ height: "100%", width: "100%" }}
      className="rounded-lg"
    />
  );
}
