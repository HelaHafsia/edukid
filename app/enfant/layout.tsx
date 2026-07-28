import { requireChildSession } from "@/lib/child-session";

export default async function EnfantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const child = await requireChildSession(); // redirige vers /parent si absent

  return (
    <div className="min-h-screen font-kid bg-gradient-to-b from-sky-200 via-sky-50 to-white">
      <header className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-2xl">
            🦊
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900 leading-tight">
              Salut {child.firstName} !
            </p>
            <p className="text-xs text-slate-500">Niveau {child.level}</p>
          </div>
        </div>
        <a
          href="/parent"
          className="text-xs bg-white/70 text-slate-600 rounded-full px-3 py-1.5 shadow-sm"
        >
          Changer de profil
        </a>
      </header>
      <main className="px-6 pb-10">{children}</main>
    </div>
  );
}
