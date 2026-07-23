"use client";

import { useEffect, useState } from "react";

type Child = {
  id: string;
  firstName: string;
  level: string;
  parent: { id: string; name: string; email: string };
};

type Parent = { id: string; name: string; email: string };

const LEVELS = ["CP", "CE1", "CE2", "CM1", "CM2"];

export default function ChildrenPage() {
  const [children, setChildren] = useState<Child[] | null>(null);
  const [parents, setParents] = useState<Parent[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [level, setLevel] = useState("CE1");
  const [parentId, setParentId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadAll() {
    const [childrenRes, parentsRes] = await Promise.all([
      fetch("/api/admin/children"),
      fetch("/api/admin/parents"),
    ]);
    if (childrenRes.ok) setChildren(await childrenRes.json());
    if (parentsRes.ok) {
      const data: Parent[] = await parentsRes.json();
      setParents(data);
      if (data.length > 0) setParentId((prev) => prev || data[0].id);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!parentId) {
      setError("Crée d'abord au moins un compte Parent.");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/admin/children", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        level,
        parentId,
        pin: pin || undefined,
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Une erreur est survenue.");
      return;
    }

    setFirstName("");
    setPin("");
    setShowForm(false);
    loadAll();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cet enfant ?")) return;
    await fetch(`/api/admin/children/${id}`, { method: "DELETE" });
    loadAll();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Enfants</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-sm bg-slate-900 text-white rounded-lg px-4 py-2 hover:bg-slate-800"
        >
          {showForm ? "Annuler" : "+ Nouvel enfant"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white border border-slate-200 rounded-xl p-5 mb-6 flex flex-col gap-3 max-w-md"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Prénom
            </label>
            <input
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

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
              Parent
            </label>
            {parents.length === 0 ? (
              <p className="text-sm text-red-600">
                Aucun parent créé. Crée d&apos;abord un compte Parent.
              </p>
            ) : (
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {parents.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.email})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              PIN à 4 chiffres (optionnel)
            </label>
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              maxLength={4}
              placeholder="1234"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting || parents.length === 0}
            className="mt-1 bg-slate-900 text-white rounded-lg px-4 py-2 text-sm hover:bg-slate-800 disabled:opacity-50"
          >
            {submitting ? "Création..." : "Créer l'enfant"}
          </button>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Prénom</th>
              <th className="text-left px-4 py-2 font-medium">Niveau</th>
              <th className="text-left px-4 py-2 font-medium">Parent</th>
              <th className="text-right px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {children === null && (
              <tr>
                <td className="px-4 py-3 text-slate-400" colSpan={4}>
                  Chargement...
                </td>
              </tr>
            )}
            {children?.length === 0 && (
              <tr>
                <td className="px-4 py-3 text-slate-400" colSpan={4}>
                  Aucun enfant pour l&apos;instant.
                </td>
              </tr>
            )}
            {children?.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{c.firstName}</td>
                <td className="px-4 py-3 text-slate-500">{c.level}</td>
                <td className="px-4 py-3 text-slate-500">{c.parent.name}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(c.id)}
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
