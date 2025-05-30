'use client';

import { useState, useEffect } from 'react';

export const useCountdown = () => {
  const [countdownActive, setCountdownActive] = useState(false);
  const [countdownValue, setCountdownValue] = useState(3);
  const [waitingForSearch, setWaitingForSearch] = useState(false);
  const [aiThinking, setAiThinking] = useState('');

  // Effect to handle countdown and visual feedback
  useEffect(() => {
    let countdownTimer: NodeJS.Timeout;
    let thinkingTimer: NodeJS.Timeout;

    if (countdownActive && countdownValue > 0) {
      countdownTimer = setTimeout(() => {
        setCountdownValue(prev => prev - 1);
      }, 1000);
    } else if (countdownActive && countdownValue === 0) {
      setCountdownActive(false);
      setWaitingForSearch(true);

      // Enhanced AI thinking simulation with database processing steps
      const thinkingPhrases = [
        "Analysiere Suchanfrage...",
        "Extrahiere Schlüsselwörter: TikTok, Instagram, Reichweite...",
        "Verbinde mit Creator-Datenbank...",
        "Durchsuche 1.253 Creator-Profile...",
        "Filtere nach Plattform und Zielgruppe...",
        "Prüfe Verfügbarkeit und Preisrahmen...",
        "Bewerte Content-Qualität und Engagement...",
        "Sortiere nach Relevanz...",
        "Optimiere Ergebnisse für maximale Conversion...",
        "Bereite Daten für Anzeige vor..."
      ];

      let phraseIndex = 0;
      setAiThinking(thinkingPhrases[0]);

      // Use shorter intervals for more dynamic feeling
      thinkingTimer = setInterval(() => {
        phraseIndex = (phraseIndex + 1) % thinkingPhrases.length;
        setAiThinking(thinkingPhrases[phraseIndex]);
      }, 800);

      // Stop thinking animation after 5 seconds
      setTimeout(() => {
        clearInterval(thinkingTimer);
        setWaitingForSearch(false);
      }, 5000);
    }

    return () => {
      if (countdownTimer) clearTimeout(countdownTimer);
      if (thinkingTimer) clearInterval(thinkingTimer);
    };
  }, [countdownActive, countdownValue]);

  const startCountdown = () => {
    setCountdownValue(3);
    setCountdownActive(true);
  };

  const stopCountdown = () => {
    setCountdownActive(false);
    setWaitingForSearch(false);
  };

  return {
    countdownActive,
    countdownValue,
    waitingForSearch,
    aiThinking,
    startCountdown,
    stopCountdown
  };
};
