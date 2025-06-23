import { createClient } from "@supabase/supabase-js";
import { fetchLiveTrackData, parseLiveTrackUrl, LiveTrackParams } from "../src/lib/useLiveTrack";

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const liveTrackUrl = process.env.LIVETRACK_URL;
  if (!liveTrackUrl) {
    console.error("LIVETRACK_URL not provided");
    return;
  }
  const params = parseLiveTrackUrl(liveTrackUrl);
  if (!params) {
    console.error("Invalid LIVETRACK_URL");
    return;
  }

  const data = await fetchLiveTrackData(params);
  const last = data.trackPoints[data.trackPoints.length - 1];
  if (!last) {
    console.error("No trackpoints found");
    return;
  }

  const supabase = createClient(supabaseUrl, anonKey);
  const channel = supabase.channel("user_locations", {
    config: { presence: { key: "charles" } },
  });

  await new Promise<void>((resolve) => {
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          lat: last.position.lat,
          lng: last.position.lon,
        });
        setTimeout(() => {
          supabase.removeChannel(channel);
          resolve();
        }, 500);
      }
    });
  });
}

main();
