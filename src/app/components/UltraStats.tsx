"use client";

import { useState } from "react";
import type { Waypoint } from "@/lib/database.types";
import { calculateDistance } from "@/lib/calculate";

interface UltraStatsProps {
  waypoints: Waypoint[];
}

export default function UltraStats({ waypoints }: UltraStatsProps) {
  const [totalProgress] = useState<number>(0);

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <div className="bg-card p-6 rounded-lg border">
        <h2 className="text-xl font-bold mb-4">🏃 Ultra Hoeilaart-Gouvy</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Progression totale</span>
              <span className="text-sm text-muted-foreground">
                {totalProgress.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className="bg-primary h-3 rounded-full transition-all duration-500"
                style={{ width: `${totalProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
