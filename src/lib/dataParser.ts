import type { WayPoint, TrackPoint } from "./types";
import { createClient } from "./supabase.server";

export async function getWaypoints(): Promise<WayPoint[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("waypoints").select("*");
  if (error) {
    console.error("Error fetching waypoints:", error);
    return [];
  }
  return (data ?? []) as WayPoint[];
}

export async function getTrackPoints(filename: string): Promise<TrackPoint[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trackpoints")
    .select("lat,lng,elevation,time")
    .eq("gpx_filename", filename)
    .order("id");

  if (error) {
    console.error("Error fetching GPX data:", error);
    return [];
  }

  return (data ?? []).map((row) => ({
    lat: row.lat,
    lng: row.lng,
    elevation: row.elevation ?? undefined,
    time: row.time ? new Date(row.time) : undefined,
  }));
}
