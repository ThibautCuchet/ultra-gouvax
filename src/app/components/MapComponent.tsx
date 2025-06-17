"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import type { WayPoint, TrackPoint, LivePosition } from "@/lib/types";

// Use CDN icons to avoid Next.js SSR issues
const createIcon = (size: [number, number] = [25, 41]) => {
  return L.icon({
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1]],
    popupAnchor: [1, -size[1] + 10],
    shadowSize: [41, 41],
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

    // Create icon
    const createIcon = (size: [number, number] = [25, 41]) => {
      return L.icon({
        iconUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        iconRetinaUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        iconSize: size,
        iconAnchor: [size[0] / 2, size[1]],
        popupAnchor: [1, -size[1] + 10],
        shadowSize: [41, 41],
      });
    };

    // Add waypoint markers
    waypoints.forEach((waypoint) => {
      const icon = waypoint.isRavito
        ? createIcon([30, 49])
        : createIcon([20, 32]);
      const marker = L.marker([waypoint.lat, waypoint.lng], { icon })
        .bindPopup(
          `
          <div class="p-2">
            <h3 class="font-semibold ${
              waypoint.isRavito ? "text-red-600" : "text-blue-600"
            }">
              ${waypoint.name}
            </h3>
            <p class="text-sm text-gray-600">
              Km ${waypoint.km} ${waypoint.isRavito ? "🥤 RAVITO" : "📍"}
            </p>
          </div>
        `
        )
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });

    // Add live position marker if available
    if (livePosition) {
      const liveIcon = createIcon([35, 57]);
      const liveMarker = L.marker([livePosition.lat, livePosition.lng], {
        icon: liveIcon,
      })
        .bindPopup(
          `
          <div class="p-2">
            <h3 class="font-semibold text-green-600">📍 Charles</h3>
            <p class="text-sm text-gray-600">Position actuelle</p>
            ${
              livePosition.speed
                ? `<p class="text-sm">Vitesse: ${livePosition.speed.toFixed(
                    1
                  )} km/h</p>`
                : ""
            }
          </div>
        `
        )
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
