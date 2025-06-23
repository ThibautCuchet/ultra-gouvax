import { useEffect, useState } from "react";
import { createClient } from "./supabase.client";

interface Position {
  lat: number;
  lng: number;
}

interface Locations {
  [key: string]: Position;
}

export function useShareLocation() {
  const [locations, setLocations] = useState<Locations>({});
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    let storedId = localStorage.getItem("share_user_id");
    if (!storedId) {
      storedId = crypto.randomUUID();
      localStorage.setItem("share_user_id", storedId);
    }
    setUserId(storedId);

    const channel = supabase.channel("user_locations", {
      config: { presence: { key: storedId } },
    });

    const syncPresence = () => {
      const state = channel.presenceState() as Record<
        string,
        { lat?: number; lng?: number }[]
      >;
      const newLocs: Locations = {};
      Object.entries(state).forEach(([id, presences]) => {
        const latest = presences[presences.length - 1];
        if (latest && latest.lat != null && latest.lng != null) {
          newLocs[id] = { lat: latest.lat, lng: latest.lng };
        }
      });
      setLocations(newLocs);
    };

    channel
      .on("presence", { event: "sync" }, syncPresence)
      .on("presence", { event: "join" }, syncPresence)
      .on("presence", { event: "leave" }, syncPresence)
      .subscribe();

    let watchId: number | null = null;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition((pos) => {
        channel.track({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      channel.unsubscribe();
    };
  }, []);

  return { locations, userId };
}
