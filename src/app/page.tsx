"use client";

import { useState, useEffect } from "react";
import UltraMap from "./components/UltraMap";
import UltraStats from "./components/UltraStats";
import type { WayPoint, LivePosition } from "@/lib/types";
import { parseCSVData } from "@/lib/dataParser";

export default function Home() {
  const [waypoints, setWaypoints] = useState<WayPoint[]>([]);
  const [livePosition, setLivePosition] = useState<LivePosition | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWaypoints() {
      try {
        const data = await parseCSVData();
        setWaypoints(data);
      } catch (error) {
        console.error("Error loading waypoints:", error);
      } finally {
        setLoading(false);
      }
    }

    loadWaypoints();
  }, []);

  // Simulate live position for demo (replace with real Garmin LiveTrack integration)
  useEffect(() => {
    const interval = setInterval(() => {
      // Demo: simulate Charles moving along the route
      const demoPositions: LivePosition[] = [
        {
          lat: 50.76637,
          lng: 4.49777,
          timestamp: new Date(),
          speed: 12.5,
        },
        {
          lat: 50.77065,
          lng: 4.53177,
          timestamp: new Date(),
          speed: 11.8,
        },
        {
          lat: 50.76081,
          lng: 4.55973,
          timestamp: new Date(),
          speed: 13.2,
        },
      ];

      const randomIndex = Math.floor(Math.random() * demoPositions.length);
      setLivePosition(demoPositions[randomIndex]);
    }, 5000); // Update every 5 seconds for demo

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="text-2xl font-bold mb-4">
                🏃‍♂️ Ultra Hoeilaart-Gouvy
              </div>
              <div className="text-muted-foreground">
                Chargement des données...
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">
            🏃‍♂️ Ultra Hoeilaart-Gouvy
          </h1>
          <p className="text-xl text-muted-foreground">
            Suivi en temps réel de Charles
          </p>
          <div className="flex items-center justify-center gap-4 mt-4 text-sm text-muted-foreground">
            <div>📍 150 km</div>
            <div>⛰️ 2030m D+</div>
            <div>🕒 6 étapes</div>
            <div>🥤 4 ravitos</div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-4">
                🗺️ Carte en temps réel
              </h2>
              <UltraMap livePosition={livePosition} />
            </div>
          </div>

          <div className="lg:col-span-1">
            <UltraStats waypoints={waypoints} livePosition={livePosition} />
          </div>
        </div>

        <footer className="mt-12 text-center text-sm text-muted-foreground border-t pt-8">
          <p>
            🚀 Application de suivi ultra créée avec Next.js, Leaflet et
            beaucoup d'amour
          </p>
          <p className="mt-2">💪 Allez Charles ! Tu peux le faire !</p>
        </footer>
      </div>
    </div>
  );
}
