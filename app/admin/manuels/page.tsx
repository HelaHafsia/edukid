"use client";

import { useEffect, useState } from "react";

type Book = {
  id: string;
  title: string;
  level: string;
  content: string | null;
  subject: { code: string; name: string };
};

type Subject = { id: string; code: string; name: string };

const LEVELS = ["CP", "CE1", "CE2", "CM1", "CM2"];

export default function ReferenceBooksPage() {
  const [books, setBooks] = useState<Book[] | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [level, setLevel] = useState("CP");
  const [subjectId, setSubjectId] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadAll() {
    const [booksRes, subjectsRes] = await Promise.all([
      fetch("/api/admin/reference-books"),
      fetch("/api/admin/subjects"),
    ]);
    if (booksRes.ok) setBooks(await booksRes.json());
    if (subjectsRes.ok) {
      const data: Subject[] = await subjectsRes.json();
      setSubjects(data);
      if (data.length > 0) setSubjectId((prev) => prev || data[0].id);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/admin/reference-books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, level, subjectId, content }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Une erreur est survenue.");
      return;
    }

    setTitle("");
    setContent("");
    setShowForm(false);
    loadAll();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce manuel de référence ?")) return;
    await fetch(`/api/admin/reference-books/${id}`, { method: "DELETE" });
    loadAll();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-semibold text-slate-900">
          Manuels de référence
        </h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-sm bg-slate-900 text-white rounded-lg px-4 py-2 hover:bg-slate-800"
        >
          {showForm ? "Annuler" : "+ Nouveau manuel"}
        </button>
      </div>
      <p className="text-sm text-slate-500 mb-6 max-w-2xl">
        Colle ici le contenu d&apos;un extrait de manuel scolaire (texte brut). Il
        sera utilisé par l&apos;IA comme référence pour générer des exercices
        d&apos;entraînement alignés sur ce que l&apos;enfant utilise réellement en
        classe, dans la rubrique Devoirs.
      </p>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white border border-slate-200 rounded-xl p-5 mb-6 flex flex-col gap-3 max-w-2xl"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Titre du manuel / de l&apos;extrait
            </label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex : Manuel de maternelle - Les nombres"
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
              Contenu de l&apos;extrait (texte collé)
            </label>
            <textarea
              required
              rows={10}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Colle ici le texte de l'extrait du manuel (leçons, exemples, exercices type...)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono text-xs"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 bg-slate-900 text-white rounded-lg px-4 py-2 text-sm hover:bg-slate-800 disabled:opacity-50"
          >
            {submitting ? "Ajout..." : "Ajouter le manuel"}
          </button>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Titre</th>
              <th className="text-left px-4 py-2 font-medium">Niveau</th>
              <th className="text-left px-4 py-2 font-medium">Matière</th>
              <th className="text-right px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {books === null && (
              <tr>
                <td className="px-4 py-3 text-slate-400" colSpan={4}>
                  Chargement...
                </td>
              </tr>
            )}
            {books?.length === 0 && (
              <tr>
                <td className="px-4 py-3 text-slate-400" colSpan={4}>
                  Aucun manuel ajouté pour l&apos;instant.
                </td>
              </tr>
            )}
            {books?.map((b) => (
              <tr key={b.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{b.title}</td>
                <td className="px-4 py-3 text-slate-500">{b.level}</td>
                <td className="px-4 py-3 text-slate-500">{b.subject.name}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="text-red-600 hover:underline"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
