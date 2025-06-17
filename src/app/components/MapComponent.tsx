"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import type { WayPoint, TrackPoint, LivePosition } from "@/lib/types";
import { calculateDistance } from "@/lib/calculate";

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
  stageTracks: Record<number, TrackPoint[]>;
  livePosition?: LivePosition;
}

export default function MapComponent({
  waypoints,
  stageTracks,
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
    Object.entries(stageTracks).forEach(([id, track]) => {
      const stageId = Number(id);
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
