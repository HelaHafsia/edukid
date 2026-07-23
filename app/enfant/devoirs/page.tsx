"use client";

import { useState } from "react";

type Exercise = {
  question: string;
  choices: string[] | null;
  answer: string;
  explanation: string;
};

type Result = {
  subjectCode: string;
  level: string;
  exercises: Exercise[];
};

const SUBJECT_LABELS: Record<string, string> = {
  FRANCAIS: "Français",
  MATHS: "Mathématiques",
  ARABE: "Arabe",
  ANGLAIS: "Anglais",
};

function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "fr-FR";
  window.speechSynthesis.speak(utterance);
}

export default function DevoirsPage() {
  const [statement, setStatement] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    const res = await fetch("/api/child/homework", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statement }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Une erreur est survenue.");
      return;
    }

    const data: Result = await res.json();
    setResult(data);
    setRevealed({});
    speak(
      `Voici des exercices pour t'entraîner sur ton devoir de ${
        SUBJECT_LABELS[data.subjectCode] ?? data.subjectCode
      }.`
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-lg font-semibold text-slate-900 mb-1">
        J&apos;ai un devoir à faire
      </h1>
      <p className="text-sm text-slate-500 mb-5">
        Écris ce que la maîtresse ou le maître a demandé, et je te prépare des
        exercices pour t&apos;entraîner avant de le faire.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-8">
        <textarea
          required
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          rows={4}
          placeholder="Ex : Faire les exercices 3 et 4 page 12 sur les additions avec retenue."
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
        />
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="bg-slate-900 text-white rounded-xl px-4 py-3 text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Je prépare tes exercices..." : "C'est parti !"}
        </button>
      </form>

      {result && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-500">
            Matière détectée :{" "}
            <span className="font-medium text-slate-700">
              {SUBJECT_LABELS[result.subjectCode] ?? result.subjectCode}
            </span>{" "}
            · Niveau : {result.level}
          </p>

          {result.exercises.map((ex, i) => (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-2xl p-5"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <p className="font-medium text-slate-900">{ex.question}</p>
                <button
                  onClick={() => speak(ex.question)}
                  aria-label="Écouter la question"
                  className="shrink-0 text-lg"
                >
                  🔊
                </button>
              </div>

              {ex.choices && (
                <div className="flex flex-col gap-2 mb-3">
                  {ex.choices.map((c) => (
                    <div
                      key={c}
                      className="text-sm bg-slate-50 rounded-lg px-3 py-2"
                    >
                      {c}
                    </div>
                  ))}
                </div>
              )}

              {!revealed[i] ? (
                <button
                  onClick={() => {
                    setRevealed((r) => ({ ...r, [i]: true }));
                    speak(`La réponse est : ${ex.answer}. ${ex.explanation}`);
                  }}
                  className="text-sm text-emerald-700 underline"
                >
                  Voir la correction
                </button>
              ) : (
                <div className="bg-emerald-50 rounded-lg px-3 py-2 text-sm text-emerald-900">
                  <p className="font-medium mb-1">Réponse : {ex.answer}</p>
                  <p>{ex.explanation}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
