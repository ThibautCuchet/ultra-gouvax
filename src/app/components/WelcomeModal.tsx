"use client";

import { useState, useEffect } from "react";
import { X, Info } from "lucide-react";

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(true); // Défaut à true pour éviter le flash

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà vu la popup
    const hasSeenWelcomeStorage = localStorage.getItem("hasSeenWelcome");
    const hasSeenBool = hasSeenWelcomeStorage === "true";

    setHasSeenWelcome(hasSeenBool);

    // Si pas encore vu, ouvrir la popup
    if (!hasSeenBool) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("hasSeenWelcome", "true");
    setHasSeenWelcome(true);
  };

  const handleReopen = () => {
    setIsOpen(true);
  };

  if (!isOpen && !hasSeenWelcome) {
    return null; // Éviter le flash pendant le chargement
  }

  return (
    <>
      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🏃‍♂️</span>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Défi Ultra Hoeilaart-Gouvy
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Fermer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-4 text-gray-700">
                <p className="text-lg leading-relaxed">
                  <strong>
                    Bienvenue sur le suivi en direct du défi de Charles !
                  </strong>
                </p>

                <p className="leading-relaxed">
                  Suivez sa progression tout au long de ses{" "}
                  <strong>150 km de course</strong> entre Hoeilaart et Gouvy. Le
                  départ est lancé ce <strong>vendredi à 19h</strong> et
                  l&apos;arrivée est prévue pour le{" "}
                  <strong>samedi 28 juin à 15h</strong>.
                </p>

                <p className="leading-relaxed">
                  Pour l&apos;encourager, sachez que{" "}
                  <strong>6 ravitaillements</strong> sont prévus tous les 25 km
                  pour recharger les batteries.
                </p>

                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                  <p className="text-blue-800 font-medium">
                    🙏 Merci pour votre soutien !
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl mb-1">📍</div>
                    <div className="font-semibold">150 km</div>
                    <div className="text-sm text-gray-600">Distance totale</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl mb-1">🥤</div>
                    <div className="font-semibold">6 ravitos</div>
                    <div className="text-sm text-gray-600">Tous les 25 km</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl mb-1">⏱️</div>
                    <div className="font-semibold">~20h</div>
                    <div className="text-sm text-gray-600">Durée estimée</div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleClose}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  <span>🚀</span>
                  Commencer à suivre Charles !
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bouton flottant pour rouvrir */}
      {!isOpen && hasSeenWelcome && (
        <button
          onClick={handleReopen}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all hover:scale-105 z-[1001]"
          aria-label="Informations sur le défi"
          title="Informations sur le défi"
        >
          <Info className="w-6 h-6" />
        </button>
      )}
    </>
  );
}
