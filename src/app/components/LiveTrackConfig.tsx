"use client";

import { useState } from "react";
import { parseLiveTrackUrl } from "@/lib/useLiveTrack";

interface LiveTrackConfigProps {
  onLiveTrackUrlChange: (url: string) => void;
  currentUrl?: string;
}

export default function LiveTrackConfig({
  onLiveTrackUrlChange,
  currentUrl = "",
}: LiveTrackConfigProps) {
  const [url, setUrl] = useState(currentUrl);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      onLiveTrackUrlChange("");
      setError(null);
      return;
    }

    const params = parseLiveTrackUrl(url);
    if (params) {
      onLiveTrackUrlChange(url);
      setError(null);
    } else {
      setError(
        "URL LiveTrack invalide. Format attendu: https://livetrack.garmin.com/session/[sessionId]/token/[token]"
      );
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg mb-4">
      <h3 className="text-lg font-semibold mb-3">Configuration LiveTrack</h3>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label
            htmlFor="livetrack-url"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            URL Garmin LiveTrack
          </label>
          <input
            id="livetrack-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://livetrack.garmin.com/session/..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Activer LiveTrack
          </button>
          {currentUrl && (
            <button
              type="button"
              onClick={() => {
                setUrl("");
                onLiveTrackUrlChange("");
                setError(null);
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Désactiver
            </button>
          )}
        </div>
      </form>

      <div className="mt-4 text-sm text-gray-600">
        <p className="font-medium">Instructions :</p>
        <ol className="list-decimal list-inside space-y-1 mt-1">
          <li>Démarrez votre activité sur votre appareil Garmin</li>
          <li>Activez LiveTrack dans les paramètres</li>
          <li>Copiez le lien LiveTrack partagé</li>
          <li>Collez le lien ci-dessus pour voir le suivi en temps réel</li>
        </ol>
      </div>
    </div>
  );
}
