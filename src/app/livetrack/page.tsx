import { redirect } from "next/navigation";
import LiveTrackConfig from "@/app/components/LiveTrackConfig";
import {
  getLiveTrackConfig,
  updateLiveTrackConfig,
} from "@/lib/live-track-actions";

export const dynamic = "force-dynamic";

export default async function LiveTrackPage() {
  // Récupérer la configuration actuelle
  const currentConfig = await getLiveTrackConfig();

  // Fonction pour gérer le changement d'URL
  async function handleLiveTrackUrlChange(url: string) {
    "use server";

    const isActive = url.trim() !== "";
    const result = await updateLiveTrackConfig(url, isActive);

    if (result.success) {
      redirect("/livetrack");
    } else {
      console.error("Erreur lors de la mise à jour:", result.error);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            Configuration LiveTrack
          </h1>

          <LiveTrackConfig
            onLiveTrackUrlChange={handleLiveTrackUrlChange}
            currentUrl={currentConfig?.live_track_url || ""}
          />

          {currentConfig?.is_active && currentConfig?.live_track_url && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-green-800 font-medium mb-2">
                LiveTrack actif
              </h3>
              <p className="text-green-700 text-sm">
                Le suivi en temps réel est configuré et actif.
              </p>
              <p className="text-green-600 text-xs mt-1 break-all">
                URL: {currentConfig.live_track_url}
              </p>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-blue-800 font-medium mb-2">
              À propos du LiveTrack
            </h3>
            <p className="text-blue-700 text-sm">
              Le LiveTrack Garmin permet de suivre votre position en temps réel
              pendant vos activités. Une fois configuré, les données de position
              seront automatiquement récupérées et affichées sur la carte
              principale.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
