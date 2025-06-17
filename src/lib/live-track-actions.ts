"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "./supabase.server";

export async function getLiveTrackConfig() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("live_track_config")
      .select("*")
      .order("id", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error("Error fetching live track config:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Unexpected error:", error);
    return null;
  }
}

export async function updateLiveTrackConfig(
  liveTrackUrl: string,
  isActive: boolean
) {
  try {
    const supabase = await createClient();

    // Get current config
    const { data: currentConfig } = await supabase
      .from("live_track_config")
      .select("*")
      .order("id", { ascending: false })
      .limit(1)
      .single();

    if (currentConfig) {
      // Update existing config
      const { error } = await supabase
        .from("live_track_config")
        .update({
          live_track_url: liveTrackUrl || null,
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentConfig.id);

      if (error) {
        console.error("Error updating live track config:", error);
        return { success: false, error: error.message };
      }
    } else {
      // Create new config
      const { error } = await supabase.from("live_track_config").insert({
        live_track_url: liveTrackUrl || null,
        is_active: isActive,
      });

      if (error) {
        console.error("Error creating live track config:", error);
        return { success: false, error: error.message };
      }
    }

    // Revalidate the home page to reflect changes
    revalidatePath("/");
    revalidatePath("/admin");

    return { success: true };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "Internal server error" };
  }
}
