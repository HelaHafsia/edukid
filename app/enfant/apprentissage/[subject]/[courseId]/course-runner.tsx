"use client";

import { useState } from "react";
import { useAutoSpeak, speak, speakPraise } from "@/lib/speech";

type Exercise = {
  id: string;
  question: string;
  choices: unknown;
  hint: string | null;
};

type Course = {
  id: string;
  title: string;
  content: string;
  exercises: Exercise[];
};

export function CourseRunner({ course }: { course: Course }) {
  const [step, setStep] = useState<"lesson" | "done" | number>("lesson");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    explanation?: string;
  } | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Lecture automatique du cours dès l'arrivée sur la page.
  useAutoSpeak(step === "lesson" ? course.content : null, [course.id]);

  const currentExercise = typeof step === "number" ? course.exercises[step] : null;

  // Lecture automatique de l'énoncé dès qu'on arrive sur un nouvel exercice.
  useAutoSpeak(currentExercise?.question ?? null, [
    typeof step === "number" ? step : -1,
  ]);

  async function startExercises() {
    if (course.exercises.length === 0) {
      await completeCourse(0, 0);
      return;
    }
    setStep(0);
  }

  async function handleSubmit(choiceValue?: string) {
    if (!currentExercise) return;
    const value = choiceValue ?? answer;
    if (!value.trim()) return;

    setSubmitting(true);
    const res = await fetch(`/api/child/practice/${currentExercise.id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer: value }),
    });
    const data = await res.json();
    setSubmitting(false);

    setFeedback(data);

    if (data.isCorrect) {
      setCorrectCount((c) => c + 1);
      speakPraise();
    } else {
      speak(`${data.explanation ?? ""}`);
    }
  }

  async function handleNext() {
    const wasCorrect = feedback?.isCorrect ?? false;
    setFeedback(null);
    setAnswer("");
    setShowHint(false);
    const next = (step as number) + 1;
    if (next >= course.exercises.length) {
      await completeCourse(correctCount, course.exercises.length);
    } else {
      setStep(next);
    }
  }

  async function completeCourse(finalCorrect: number, total: number) {
    await fetch(`/api/child/course/${course.id}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correctAnswers: finalCorrect, totalQuestions: total }),
    });
    setStep("done");
  }

  if (step === "done") {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
        <p className="text-3xl mb-2">🎉</p>
        <p className="font-semibold text-slate-900 mb-1">Cours terminé !</p>
        <p className="text-sm text-slate-500 mb-4">
          {correctCount} / {course.exercises.length} exercices réussis
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

  if (step === "lesson") {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <h1 className="text-lg font-semibold text-slate-900">{course.title}</h1>
          <button onClick={() => speak(course.content)} className="text-lg shrink-0">
            🔊
          </button>
        </div>
        <p className="text-slate-700 leading-relaxed mb-6">{course.content}</p>
        <button
          onClick={startExercises}
          className="bg-emerald-600 text-white rounded-xl px-5 py-3 text-sm font-medium"
        >
          {course.exercises.length > 0
            ? "C'est parti pour les exercices !"
            : "Terminer le cours"}
        </button>
      </div>
    );
  }

  const choices = Array.isArray(currentExercise?.choices)
    ? (currentExercise!.choices as string[])
    : null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <p className="text-xs text-slate-400 mb-2">
        Exercice {(step as number) + 1} / {course.exercises.length}
      </p>

      <div className="flex items-start justify-between gap-3 mb-4">
        <p className="font-medium text-slate-900">{currentExercise?.question}</p>
        <button
          onClick={() => currentExercise && speak(currentExercise.question)}
          className="text-lg shrink-0"
        >
          🔊
        </button>
      </div>

      {!feedback && (
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

          {currentExercise?.hint && (
            <div className="mt-3">
              {!showHint ? (
                <button
                  onClick={() => {
                    setShowHint(true);
                    speak(currentExercise.hint!);
                  }}
                  className="text-sm text-amber-700 underline"
                >
                  💡 Besoin d&apos;un indice ?
                </button>
              ) : (
                <p className="text-sm bg-amber-50 text-amber-900 rounded-lg px-3 py-2">
                  💡 {currentExercise.hint}
                </p>
              )}
            </div>
          )}
        </>
      )}

      {feedback && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            feedback.isCorrect
              ? "bg-emerald-50 text-emerald-900"
              : "bg-amber-50 text-amber-900"
          }`}
        >
          <p className="font-medium mb-1">
            {feedback.isCorrect ? "Bravo, bonne réponse ! 🎉" : "Pas tout à fait !"}
          </p>
          {feedback.explanation && <p>{feedback.explanation}</p>}
          <button
            onClick={handleNext}
            className="mt-3 bg-slate-900 text-white rounded-lg px-4 py-2 text-sm"
          >
            Continuer
          </button>
        </div>
      )}
    </div>
  );
}
