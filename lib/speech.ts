"use client";

import { useEffect, useRef } from "react";

// ----------------------------------------------------------------------------
// EduKid — Synthèse vocale (Web Speech API, voix fr-FR)
//
// Utilisé partout dans l'espace Enfant : lecture des cours, énoncés
// d'exercices/quiz/évaluations, messages de félicitations/encouragement.
// ----------------------------------------------------------------------------

export function speak(text: string, opts?: { rate?: number }) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel(); // n'empile jamais plusieurs lectures
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "fr-FR";
  utterance.rate = opts?.rate ?? 0.95; // légèrement plus lent, plus adapté à un enfant
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

const PRAISES = [
  "Bravo, c'est la bonne réponse !",
  "Super, tu as trouvé !",
  "Génial, continue comme ça !",
  "Excellent travail !",
  "Bien joué !",
];

export function speakPraise() {
  speak(PRAISES[Math.floor(Math.random() * PRAISES.length)]);
}

export function speakEncouragement(hint?: string | null) {
  const base = "Ce n'est pas tout à fait ça, essaie encore.";
  speak(hint ? `${base} ${hint}` : base);
}

// Hook : lit automatiquement `text` dès qu'il change (montage inclus),
// sans que l'enfant ait besoin de cliquer sur quoi que ce soit.
export function useAutoSpeak(text: string | null | undefined, deps: unknown[] = []) {
  const lastSpoken = useRef<string | null>(null);

  useEffect(() => {
    if (!text) return;
    // Évite de relire deux fois le même texte si le composant re-render
    // sans changement réel de contenu.
    if (lastSpoken.current === text) return;
    lastSpoken.current = text;
    speak(text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
