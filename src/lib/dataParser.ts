import { createClient } from "./supabase.server";
import { Step } from "./database.types";

export async function getData() {
  const supabase = await createClient();

  const [waypoints, steps, trackpoints] = await Promise.all([
    supabase.from("waypoints").select("*"),
    supabase.from("steps").select("*"),
    supabase.from("trackpoints").select("*"),
  ]);

  return {
    waypoints: waypoints.data ?? [],
    steps: steps.data ?? [],
    trackpoints: trackpoints.data ?? [],
  };
}
