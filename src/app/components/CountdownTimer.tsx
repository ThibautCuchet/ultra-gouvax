"use client";

import { useState, useEffect } from "react";

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    // Définir l'heure de départ pour aujourd'hui à 19h
    const today = new Date();
    const startTime = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      19, // 19h
      0, // 0 minutes
      0 // 0 secondes
    );

    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = startTime.getTime() - now.getTime();

      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ hours, minutes, seconds });
        setHasStarted(false);
      } else {
        setTimeLeft(null);
        setHasStarted(true);
      }
    };

    // Calculer immédiatement
    calculateTimeLeft();

    // Mettre à jour chaque seconde
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  if (hasStarted) {
    return (
      <div className="bg-green-100 border border-green-300 rounded-lg p-6 text-center">
        <div className="text-2xl font-bold text-green-800 mb-2">
          🏃‍♂️ C'est parti !
        </div>
        <div className="text-green-700">
          Charles a pris le départ ! Suivez sa progression en temps réel.
        </div>
      </div>
    );
  }

  if (!timeLeft) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
      <div className="text-lg font-semibold text-blue-900 mb-4">
        ⏰ Départ dans
      </div>
      <div className="flex justify-center gap-4 mb-4">
        <div className="bg-white rounded-lg p-3 shadow-sm border">
          <div className="text-2xl font-bold text-blue-800">
            {timeLeft.hours.toString().padStart(2, "0")}
          </div>
          <div className="text-sm text-blue-600">heures</div>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm border">
          <div className="text-2xl font-bold text-blue-800">
            {timeLeft.minutes.toString().padStart(2, "0")}
          </div>
          <div className="text-sm text-blue-600">minutes</div>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm border">
          <div className="text-2xl font-bold text-blue-800">
            {timeLeft.seconds.toString().padStart(2, "0")}
          </div>
          <div className="text-sm text-blue-600">secondes</div>
        </div>
      </div>
      <div className="text-blue-700">
        Départ prévu aujourd&apos;hui à <strong>19h00</strong>
      </div>
    </div>
  );
}
