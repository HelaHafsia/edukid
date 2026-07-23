"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Child = { id: string; firstName: string; level: string; hasPin: boolean };

export default function ParentHomePage() {
  const router = useRouter();
  const [children, setChildren] = useState<Child[] | null>(null);
  const [selected, setSelected] = useState<Child | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/parent/children")
      .then((r) => r.json())
      .then(setChildren);
  }, []);

  async function handleSelect(child: Child) {
    setError(null);
    if (child.hasPin) {
      setSelected(child);
      return;
    }
    await confirmSelection(child.id);
  }

  async function confirmSelection(childId: string, pinValue?: string) {
    const res = await fetch("/api/child/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childId, pin: pinValue }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erreur.");
      return;
    }
    router.push("/enfant");
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-xl font-semibold text-slate-900 mb-6 text-center">
          Qui es-tu ?
        </h1>

        {!selected && (
          <div className="grid grid-cols-2 gap-4">
            {children?.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelect(c)}
                className="bg-white border border-slate-200 rounded-2xl p-6 text-center hover:border-slate-400 transition"
              >
                <div className="text-3xl mb-2">🧒</div>
                <p className="font-medium text-slate-900">{c.firstName}</p>
                <p className="text-xs text-slate-500">{c.level}</p>
              </button>
            ))}
            {children?.length === 0 && (
              <p className="col-span-2 text-center text-sm text-slate-500">
                Aucun enfant associé à ce compte pour l&apos;instant.
              </p>
            )}
          </div>
        )}

        {selected && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
            <p className="font-medium text-slate-900 mb-4">
              Code de {selected.firstName}
            </p>
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              maxLength={4}
              inputMode="numeric"
              className="w-32 mx-auto text-center text-2xl tracking-widest rounded-lg border border-slate-300 px-3 py-2"
              placeholder="••••"
            />
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
            <div className="flex gap-2 justify-center mt-4">
              <button
                onClick={() => setSelected(null)}
                className="text-sm text-slate-500"
              >
                Retour
              </button>
              <button
                onClick={() => confirmSelection(selected.id, pin)}
                className="text-sm bg-slate-900 text-white rounded-lg px-4 py-2"
              >
                Valider
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
