import type { WayPoint, TrackPoint } from "./types";

export async function parseCSVData(): Promise<WayPoint[]> {
  try {
    const response = await fetch("/api/waypoints");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error parsing CSV data:", error);
    return [];
  }
}

export async function parseGPXData(filename: string): Promise<TrackPoint[]> {
  try {
    const response = await fetch(`/api/gpx/${encodeURIComponent(filename)}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error parsing GPX data:", error);
    return [];
  }
}

// Utility to calculate distance between two points (Haversine formula)
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Find closest point on track to a given position
export function findClosestTrackPoint(
  position: { lat: number; lng: number },
  track: TrackPoint[]
): { point: TrackPoint; index: number; distance: number } | null {
  if (track.length === 0) return null;

  let closestPoint = track[0];
  let closestIndex = 0;
  let minDistance = calculateDistance(
    position.lat,
    position.lng,
    track[0].lat,
    track[0].lng
  );

  for (let i = 1; i < track.length; i++) {
    const distance = calculateDistance(
      position.lat,
      position.lng,
      track[i].lat,
      track[i].lng
    );
    if (distance < minDistance) {
      minDistance = distance;
      closestPoint = track[i];
      closestIndex = i;
    }
  }

  return {
    point: closestPoint,
    index: closestIndex,
    distance: minDistance,
  };
}

// Calculate progress along the track
export function calculateProgress(
  trackIndex: number,
  totalTrackPoints: number
): number {
  return Math.min(100, (trackIndex / Math.max(1, totalTrackPoints - 1)) * 100);
}
