import { useEffect, useRef, useState } from "react";
import { createClient } from "./supabase.client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface Position {
  lat: number;
  lng: number;
}

interface Locations {
  [key: string]: Position;
}

export function useShareLocation(enabled: boolean) {
  const [locations, setLocations] = useState<Locations>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    const supabase = createClient();

    let storedId = localStorage.getItem("share_user_id");
    if (!storedId) {
      storedId = crypto.randomUUID();
      localStorage.setItem("share_user_id", storedId);
    }
    setUserId(storedId);

    const ch = supabase.channel("user_locations", {
      config: { presence: { key: storedId } },
    });

    const syncPresence = () => {
      const state = ch.presenceState() as Record<
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

    ch
      .on("presence", { event: "sync" }, syncPresence)
      .on("presence", { event: "join" }, syncPresence)
      .on("presence", { event: "leave" }, syncPresence)
      .subscribe();
    setChannel(ch);

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      ch.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!channel) return;
    if (enabled) {
      if (navigator.geolocation && watchIdRef.current === null) {
        watchIdRef.current = navigator.geolocation.watchPosition((pos) => {
          channel.track({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        });
      }
    } else {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        channel.untrack();
      }
    }
  }, [enabled, channel]);

  return { locations, userId };
}
