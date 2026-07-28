"use client";

import { useEffect, useState } from "react";

type Subject = { id: string; code: string; name: string };
type Tab = "cours" | "quiz" | "evaluations";

const LEVELS = ["CP", "CE1", "CE2", "CM1", "CM2"];

type DraftExercise = {
  question: string;
  choicesRaw: string;
  answer: string;
  hint: string;
  explanation: string;
};

type DraftQuizQuestion = {
  question: string;
  choicesRaw: string;
  answer: string;
  hint: string;
};

type DraftEvalQuestion = DraftQuizQuestion & { skillTag: string };

function emptyExercise(): DraftExercise {
  return { question: "", choicesRaw: "", answer: "", hint: "", explanation: "" };
}
function emptyQuizQuestion(): DraftQuizQuestion {
  return { question: "", choicesRaw: "", answer: "", hint: "" };
}
function emptyEvalQuestion(): DraftEvalQuestion {
  return { question: "", choicesRaw: "", answer: "", hint: "", skillTag: "" };
}

function parseChoices(raw: string): string[] | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  return trimmed.split("|").map((c) => c.trim()).filter(Boolean);
}

export default function ContenuPage() {
  const [tab, setTab] = useState<Tab>("cours");
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    fetch("/api/admin/subjects")
      .then((r) => r.json())
      .then(setSubjects);
  }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900 mb-4">
        Contenu pédagogique
      </h1>

      <div className="flex gap-2 mb-6">
        {(["cours", "quiz", "evaluations"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-sm rounded-lg px-4 py-2 ${
              tab === t
                ? "bg-slate-900 text-white"
                : "bg-white border border-slate-200 text-slate-600"
            }`}
          >
            {t === "cours" ? "Cours" : t === "quiz" ? "Quiz" : "Évaluations"}
          </button>
        ))}
      </div>

      {tab === "cours" && <CoursForm subjects={subjects} />}
      {tab === "quiz" && <QuizForm subjects={subjects} />}
      {tab === "evaluations" && <EvaluationForm subjects={subjects} />}
    </div>
  );
}

function CoursForm({ subjects }: { subjects: Subject[] }) {
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState("CP");
  const [subjectId, setSubjectId] = useState("");
  const [content, setContent] = useState("");
  const [exercises, setExercises] = useState<DraftExercise[]>([emptyExercise()]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (subjects.length > 0 && !subjectId) setSubjectId(subjects[0].id);
  }, [subjects]);

  async function handleGenerate() {
    if (!topic.trim() || !subjectId) return;
    setError(null);
    setGenerating(true);

    const subjectCode = subjects.find((s) => s.id === subjectId)?.code;
    const res = await fetch("/api/admin/generate-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "cours", subjectCode, level, topic }),
    });
    setGenerating(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erreur de génération.");
      return;
    }

    const data = await res.json();
    setTitle(data.title ?? "");
    setContent(data.content ?? "");
    setExercises(
      (data.exercises ?? []).map((ex: any) => ({
        question: ex.question ?? "",
        choicesRaw: Array.isArray(ex.choices) ? ex.choices.join(" | ") : "",
        answer: ex.answer ?? "",
        hint: ex.hint ?? "",
        explanation: ex.explanation ?? "",
      }))
    );
  }

  function updateExercise(i: number, patch: Partial<DraftExercise>) {
    setExercises((exs) => exs.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    const res = await fetch("/api/admin/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        level,
        subjectId,
        content,
        exercises: exercises
          .filter((ex) => ex.question.trim())
          .map((ex) => ({
            question: ex.question,
            choices: parseChoices(ex.choicesRaw),
            answer: ex.answer,
            hint: ex.hint || undefined,
            explanation: ex.explanation,
          })),
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erreur.");
      return;
    }

    setSuccess("Cours créé avec succès !");
    setTitle("");
    setContent("");
    setExercises([emptyExercise()]);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl flex flex-col gap-4">
      <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
        <label className="block text-sm font-medium text-violet-900 mb-1">
          ✨ Générer avec l&apos;IA — thème du cours
        </label>
        <div className="flex gap-2">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ex : Compter jusqu'à 10, les lettres de l'alphabet..."
            className="flex-1 rounded-lg border border-violet-300 px-3 py-2 text-sm bg-white"
          />
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || !topic.trim() || !subjectId}
            className="bg-violet-600 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50 shrink-0"
          >
            {generating ? "Génération..." : "Générer"}
          </button>
        </div>
        <p className="text-xs text-violet-700 mt-1">
          Choisis d&apos;abord le niveau et la matière ci-dessous, puis décris le
          thème. Tu pourras relire et modifier avant d&apos;enregistrer.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Titre du cours
        </label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Niveau
          </label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Matière
          </label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Contenu du cours (lu à voix haute à l&apos;enfant)
        </label>
        <textarea
          required
          rows={5}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Ex : Aujourd'hui, on apprend à compter jusqu'à 10..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <p className="text-sm font-medium text-slate-700 mb-2">
          Exercices de pratique (correction complète autorisée ici)
        </p>
        <div className="flex flex-col gap-4">
          {exercises.map((ex, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-2">Exercice {i + 1}</p>
              <input
                placeholder="Question"
                value={ex.question}
                onChange={(e) => updateExercise(i, { question: e.target.value })}
                className="w-full mb-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                placeholder="Choix (séparés par | ) — laisser vide si réponse libre"
                value={ex.choicesRaw}
                onChange={(e) => updateExercise(i, { choicesRaw: e.target.value })}
                className="w-full mb-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                placeholder="Réponse correcte"
                value={ex.answer}
                onChange={(e) => updateExercise(i, { answer: e.target.value })}
                className="w-full mb-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                placeholder="Indice (optionnel)"
                value={ex.hint}
                onChange={(e) => updateExercise(i, { hint: e.target.value })}
                className="w-full mb-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <textarea
                placeholder="Explication de la correction"
                value={ex.explanation}
                onChange={(e) => updateExercise(i, { explanation: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setExercises((exs) => [...exs, emptyExercise()])}
          className="mt-2 text-sm text-slate-600 underline"
        >
          + Ajouter un exercice
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-emerald-600">{success}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="bg-slate-900 text-white rounded-lg px-4 py-2 text-sm w-fit disabled:opacity-50"
      >
        {submitting ? "Création..." : "Créer le cours"}
      </button>
    </form>
  );
}

function QuizForm({ subjects }: { subjects: Subject[] }) {
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState("CP");
  const [subjectId, setSubjectId] = useState("");
  const [questions, setQuestions] = useState<DraftQuizQuestion[]>([
    emptyQuizQuestion(),
  ]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (subjects.length > 0 && !subjectId) setSubjectId(subjects[0].id);
  }, [subjects]);

  async function handleGenerate() {
    if (!topic.trim() || !subjectId) return;
    setError(null);
    setGenerating(true);

    const subjectCode = subjects.find((s) => s.id === subjectId)?.code;
    const res = await fetch("/api/admin/generate-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "quiz", subjectCode, level, topic }),
    });
    setGenerating(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erreur de génération.");
      return;
    }

    const data = await res.json();
    setTitle(data.title ?? "");
    setQuestions(
      (data.questions ?? []).map((q: any) => ({
        question: q.question ?? "",
        choicesRaw: Array.isArray(q.choices) ? q.choices.join(" | ") : "",
        answer: q.answer ?? "",
        hint: q.hint ?? "",
      }))
    );
  }

  function updateQuestion(i: number, patch: Partial<DraftQuizQuestion>) {
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    const res = await fetch("/api/admin/quizzes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        level,
        subjectId,
        questions: questions
          .filter((q) => q.question.trim())
          .map((q) => ({
            question: q.question,
            choices: parseChoices(q.choicesRaw),
            answer: q.answer,
            hint: q.hint || undefined,
          })),
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erreur.");
      return;
    }

    setSuccess("Quiz créé avec succès !");
    setTitle("");
    setQuestions([emptyQuizQuestion()]);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl flex flex-col gap-4">
      <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
        <label className="block text-sm font-medium text-violet-900 mb-1">
          ✨ Générer avec l&apos;IA — thème du quiz
        </label>
        <div className="flex gap-2">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ex : Les additions jusqu'à 10"
            className="flex-1 rounded-lg border border-violet-300 px-3 py-2 text-sm bg-white"
          />
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || !topic.trim() || !subjectId}
            className="bg-violet-600 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50 shrink-0"
          >
            {generating ? "Génération..." : "Générer"}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Titre du quiz
        </label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Niveau
          </label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Matière
          </label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-slate-700 mb-2">
          Questions (jamais de correction affichée à l&apos;enfant, hint seulement)
        </p>
        <div className="flex flex-col gap-4">
          {questions.map((q, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-2">Question {i + 1}</p>
              <input
                placeholder="Question"
                value={q.question}
                onChange={(e) => updateQuestion(i, { question: e.target.value })}
                className="w-full mb-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                placeholder="Choix (séparés par | ) — laisser vide si réponse libre"
                value={q.choicesRaw}
                onChange={(e) => updateQuestion(i, { choicesRaw: e.target.value })}
                className="w-full mb-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                placeholder="Réponse correcte"
                value={q.answer}
                onChange={(e) => updateQuestion(i, { answer: e.target.value })}
                className="w-full mb-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                placeholder="Indice donné en cas d'erreur"
                value={q.hint}
                onChange={(e) => updateQuestion(i, { hint: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setQuestions((qs) => [...qs, emptyQuizQuestion()])}
          className="mt-2 text-sm text-slate-600 underline"
        >
          + Ajouter une question
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-emerald-600">{success}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="bg-slate-900 text-white rounded-lg px-4 py-2 text-sm w-fit disabled:opacity-50"
      >
        {submitting ? "Création..." : "Créer le quiz"}
      </button>
    </form>
  );
}

function EvaluationForm({ subjects }: { subjects: Subject[] }) {
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState("CP");
  const [subjectId, setSubjectId] = useState("");
  const [questions, setQuestions] = useState<DraftEvalQuestion[]>([
    emptyEvalQuestion(),
  ]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (subjects.length > 0 && !subjectId) setSubjectId(subjects[0].id);
  }, [subjects]);

  async function handleGenerate() {
    if (!topic.trim() || !subjectId) return;
    setError(null);
    setGenerating(true);

    const subjectCode = subjects.find((s) => s.id === subjectId)?.code;
    const res = await fetch("/api/admin/generate-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "evaluation", subjectCode, level, topic }),
    });
    setGenerating(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erreur de génération.");
      return;
    }

    const data = await res.json();
    setTitle(data.title ?? "");
    setQuestions(
      (data.questions ?? []).map((q: any) => ({
        question: q.question ?? "",
        choicesRaw: Array.isArray(q.choices) ? q.choices.join(" | ") : "",
        answer: q.answer ?? "",
        hint: q.hint ?? "",
        skillTag: q.skillTag ?? "",
      }))
    );
  }

  function updateQuestion(i: number, patch: Partial<DraftEvalQuestion>) {
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    const res = await fetch("/api/admin/evaluations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        level,
        subjectId,
        questions: questions
          .filter((q) => q.question.trim())
          .map((q) => ({
            question: q.question,
            choices: parseChoices(q.choicesRaw),
            answer: q.answer,
            hint: q.hint || undefined,
            skillTag: q.skillTag,
          })),
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erreur.");
      return;
    }

    setSuccess("Évaluation créée avec succès !");
    setTitle("");
    setQuestions([emptyEvalQuestion()]);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl flex flex-col gap-4">
      <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
        <label className="block text-sm font-medium text-violet-900 mb-1">
          ✨ Générer avec l&apos;IA — thème de l&apos;évaluation
        </label>
        <div className="flex gap-2">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ex : Bilan sur les additions et soustractions simples"
            className="flex-1 rounded-lg border border-violet-300 px-3 py-2 text-sm bg-white"
          />
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || !topic.trim() || !subjectId}
            className="bg-violet-600 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50 shrink-0"
          >
            {generating ? "Génération..." : "Générer"}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Titre de l&apos;évaluation
        </label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Niveau
          </label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Matière
          </label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-slate-700 mb-2">
          Questions (hint seulement + compétence évaluée pour le bilan)
        </p>
        <div className="flex flex-col gap-4">
          {questions.map((q, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-2">Question {i + 1}</p>
              <input
                placeholder="Question"
                value={q.question}
                onChange={(e) => updateQuestion(i, { question: e.target.value })}
                className="w-full mb-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                placeholder="Choix (séparés par | ) — laisser vide si réponse libre"
                value={q.choicesRaw}
                onChange={(e) => updateQuestion(i, { choicesRaw: e.target.value })}
                className="w-full mb-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                placeholder="Réponse correcte"
                value={q.answer}
                onChange={(e) => updateQuestion(i, { answer: e.target.value })}
                className="w-full mb-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                placeholder="Indice donné en cas d'erreur"
                value={q.hint}
                onChange={(e) => updateQuestion(i, { hint: e.target.value })}
                className="w-full mb-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                placeholder="Compétence évaluée (ex : addition-simple)"
                value={q.skillTag}
                onChange={(e) => updateQuestion(i, { skillTag: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setQuestions((qs) => [...qs, emptyEvalQuestion()])}
          className="mt-2 text-sm text-slate-600 underline"
        >
          + Ajouter une question
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-emerald-600">{success}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="bg-slate-900 text-white rounded-lg px-4 py-2 text-sm w-fit disabled:opacity-50"
      >
        {submitting ? "Création..." : "Créer l'évaluation"}
      </button>
    </form>
  );
}
