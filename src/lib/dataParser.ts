import { createClient } from "./supabase.server";
import { getLiveTrackConfig } from "./live-track-actions";

export async function getData() {
  const supabase = await createClient();

  const [waypoints, steps, trackpoints, liveTrackConfig] = await Promise.all([
    supabase.from("waypoints").select("*"),
    supabase.from("steps").select("*"),
    supabase.from("trackpoints").select("*"),
    getLiveTrackConfig(),
  ]);

  return {
    waypoints: waypoints.data ?? [],
    steps: steps.data ?? [],
    trackpoints: trackpoints.data ?? [],
    liveTrackConfig: liveTrackConfig ?? null,
  };
}
