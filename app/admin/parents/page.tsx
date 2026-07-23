"use client";

import { useEffect, useState } from "react";

type Parent = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  children: { id: string; firstName: string; level: string }[];
};

export default function ParentsPage() {
  const [parents, setParents] = useState<Parent[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadParents() {
    const res = await fetch("/api/admin/parents");
    if (res.ok) setParents(await res.json());
  }

  useEffect(() => {
    loadParents();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/admin/parents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Une erreur est survenue.");
      return;
    }

    setName("");
    setEmail("");
    setPassword("");
    setShowForm(false);
    loadParents();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce parent et tous ses enfants associés ?")) return;
    await fetch(`/api/admin/parents/${id}`, { method: "DELETE" });
    loadParents();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Parents</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-sm bg-slate-900 text-white rounded-lg px-4 py-2 hover:bg-slate-800"
        >
          {showForm ? "Annuler" : "+ Nouveau parent"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white border border-slate-200 rounded-xl p-5 mb-6 flex flex-col gap-3 max-w-md"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nom
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Mot de passe temporaire
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="mt-1 bg-slate-900 text-white rounded-lg px-4 py-2 text-sm hover:bg-slate-800 disabled:opacity-50"
          >
            {submitting ? "Création..." : "Créer le compte"}
          </button>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Nom</th>
              <th className="text-left px-4 py-2 font-medium">Email</th>
              <th className="text-left px-4 py-2 font-medium">Enfants</th>
              <th className="text-right px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {parents === null && (
              <tr>
                <td className="px-4 py-3 text-slate-400" colSpan={4}>
                  Chargement...
                </td>
              </tr>
            )}
            {parents?.length === 0 && (
              <tr>
                <td className="px-4 py-3 text-slate-400" colSpan={4}>
                  Aucun parent pour l&apos;instant.
                </td>
              </tr>
            )}
            {parents?.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{p.name}</td>
                <td className="px-4 py-3 text-slate-500">{p.email}</td>
                <td className="px-4 py-3 text-slate-500">
                  {p.children.length === 0
                    ? "—"
                    : p.children.map((c) => c.firstName).join(", ")}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(p.id)}
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
