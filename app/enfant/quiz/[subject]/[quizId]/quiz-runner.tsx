"use client";

import { useState } from "react";
import { useAutoSpeak, speak, speakPraise, speakEncouragement } from "@/lib/speech";

type Question = { id: string; question: string; choices: unknown; order: number };

export function QuizRunner({
  quizId,
  title,
  questions,
}: {
  quizId: string;
  title: string;
  questions: Question[];
}) {
  const [index, setIndex] = useState(0);
  const [firstTryCorrect, setFirstTryCorrect] = useState<Record<number, boolean>>({});
  const [attempted, setAttempted] = useState(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; hint?: string } | null>(
    null
  );
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const current = questions[index];
  useAutoSpeak(current?.question ?? null, [index]);

  async function handleSubmit(choiceValue?: string) {
    const value = choiceValue ?? answer;
    if (!value.trim() || !current) return;

    setSubmitting(true);
    const res = await fetch(`/api/child/quiz-question/${current.id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer: value }),
    });
    const data = await res.json();
    setSubmitting(false);
    setFeedback(data);

    if (!attempted) {
      setFirstTryCorrect((f) => ({ ...f, [index]: data.isCorrect }));
      setAttempted(true);
    }

    if (data.isCorrect) {
      speakPraise();
    } else {
      speakEncouragement(data.hint);
    }
  }

  async function handleNext() {
    setFeedback(null);
    setAnswer("");
    setAttempted(false);

    if (index + 1 >= questions.length) {
      const correctCount = Object.values(firstTryCorrect).filter(Boolean).length;
      await fetch(`/api/child/quiz/${quizId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correctAnswers: correctCount,
          totalQuestions: questions.length,
        }),
      });
      setDone(true);
    } else {
      setIndex((i) => i + 1);
    }
  }

  if (questions.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Ce quiz n&apos;a pas encore de questions.
      </p>
    );
  }

  if (done) {
    const correctCount = Object.values(firstTryCorrect).filter(Boolean).length;
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
        <p className="text-3xl mb-2">⚡</p>
        <p className="font-semibold text-slate-900 mb-1">Quiz terminé !</p>
        <p className="text-sm text-slate-500 mb-4">
          {correctCount} / {questions.length} bonnes réponses
        </p>
        <a
          href="/enfant"
          className="inline-block bg-slate-900 text-white rounded-lg px-4 py-2 text-sm"
        >
          Retour à l&apos;accueil
        </a>
      </div>
    );
  }

  const choices = Array.isArray(current?.choices) ? (current!.choices as string[]) : null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <p className="text-xs text-slate-400 mb-2">
        Question {index + 1} / {questions.length}
      </p>

      <div className="flex items-start justify-between gap-3 mb-4">
        <p className="font-medium text-slate-900">{current.question}</p>
        <button onClick={() => speak(current.question)} className="text-lg shrink-0">
          🔊
        </button>
      </div>

      {!feedback || !feedback.isCorrect ? (
        <>
          {choices ? (
            <div className="flex flex-col gap-2">
              {choices.map((c) => (
                <button
                  key={c}
                  onClick={() => handleSubmit(c)}
                  disabled={submitting}
                  className="text-left text-sm bg-slate-50 hover:bg-slate-100 rounded-lg px-4 py-3"
                >
                  {c}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Ta réponse"
              />
              <button
                onClick={() => handleSubmit()}
                disabled={submitting}
                className="bg-slate-900 text-white rounded-lg px-4 py-2 text-sm"
              >
                Valider
              </button>
            </div>
          )}

          {feedback && !feedback.isCorrect && (
            <div className="mt-3 bg-amber-50 text-amber-900 rounded-lg px-4 py-3 text-sm">
              <p className="font-medium mb-1">Pas tout à fait !</p>
              {feedback.hint && <p>{feedback.hint}</p>}
              <p className="mt-1 text-amber-700">Essaie encore 👆</p>
            </div>
          )}
        </>
      ) : (
        <div className="bg-emerald-50 text-emerald-900 rounded-lg px-4 py-3 text-sm">
          <p className="font-medium mb-2">Bravo, bonne réponse ! 🎉</p>
          <button
            onClick={handleNext}
            className="bg-slate-900 text-white rounded-lg px-4 py-2 text-sm"
          >
            {index + 1 >= questions.length ? "Voir mon score" : "Question suivante"}
          </button>
        </div>
      )}
    </div>
  );
}
