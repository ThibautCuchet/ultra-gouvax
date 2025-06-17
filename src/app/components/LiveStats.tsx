"use client";

import { FitnessPointData } from "@/lib/useLiveTrack";

interface LiveStatsProps {
  fitnessData?: FitnessPointData;
  isConnected: boolean;
  loading: boolean;
  isFetching?: boolean;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, "0")}m ${secs
      .toString()
      .padStart(2, "0")}s`;
  }
  return `${minutes}m ${secs.toString().padStart(2, "0")}s`;
}

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${meters.toFixed(0)} m`;
}

function formatSpeed(metersPerSec: number): string {
  const kmh = metersPerSec * 3.6;
  return `${kmh.toFixed(1)} km/h`;
}

export default function LiveStats({
  fitnessData,
  isConnected,
  loading,
  isFetching = false,
}: LiveStatsProps) {
  if (!isConnected && !loading) {
    return (
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2 text-gray-500">
          📊 Statistiques Live
        </h3>
        <p className="text-gray-400">
          LiveTrack pas encore disponible. N&apos;hésites pas à recharger la
          page !
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2 text-blue-700">
          📊 Statistiques Live
        </h3>
        <p className="text-blue-600">Chargement des données...</p>
      </div>
    );
  }

  if (!fitnessData) {
    return (
      <div className="bg-yellow-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2 text-yellow-700">
          📊 Statistiques Live
        </h3>
        <p className="text-yellow-600">En attente des données fitness...</p>
      </div>
    );
  }

  return (
    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
      <h3 className="text-lg font-semibold mb-3 text-green-800 flex items-center gap-2">
        📊 Statistiques Live
        <div
          className={`w-2 h-2 rounded-full ${
            isFetching ? "bg-yellow-500 animate-pulse" : "bg-green-500"
          }`}
        ></div>
      </h3>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-white p-3 rounded border">
          <div className="text-gray-600 text-xs">⏱️ DURÉE TOTALE</div>
          <div className="font-bold text-lg text-gray-900">
            {formatDuration(fitnessData.totalDurationSecs)}
          </div>
        </div>

        <div className="bg-white p-3 rounded border">
          <div className="text-gray-600 text-xs">🏃 VITESSE</div>
          <div className="font-bold text-lg text-blue-600">
            {formatSpeed(fitnessData.speedMetersPerSec)}
          </div>
        </div>

        <div className="bg-white p-3 rounded border">
          <div className="text-gray-600 text-xs">📏 DISTANCE TOTALE</div>
          <div className="font-bold text-lg text-green-600">
            {formatDistance(fitnessData.totalDistanceMeters)}
          </div>
        </div>

        <div className="bg-white p-3 rounded border">
          <div className="text-gray-600 text-xs">⛰️ DÉNIVELÉ +</div>
          <div className="font-bold text-lg text-orange-600">
            {fitnessData.elevationGainMeters.toFixed(0)} m
          </div>
        </div>

        <div className="bg-white p-3 rounded border">
          <div className="text-gray-600 text-xs">❤️ FRÉQUENCE CARDIAQUE</div>
          <div className="font-bold text-lg text-red-600">
            {fitnessData.heartRateBeatsPerMin} bpm
          </div>
        </div>

        <div className="bg-white p-3 rounded border">
          <div className="text-gray-600 text-xs">📍 STATUT</div>
          <div className="font-bold text-sm text-gray-700">
            {fitnessData.pointStatus === "STATIONARY"
              ? "🛑 Arrêté"
              : fitnessData.pointStatus === "MOVING"
              ? "🏃 En mouvement"
              : fitnessData.pointStatus}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {fitnessData.activityType}
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-500 text-center">
        Dernière mise à jour : {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}
