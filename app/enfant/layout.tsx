import { requireChildSession } from "@/lib/child-session";

export default async function EnfantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const child = await requireChildSession(); // redirige vers /parent si absent

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      <header className="flex items-center justify-between px-6 py-4">
        <p className="text-lg font-semibold text-slate-900">
          Salut {child.firstName} 👋
        </p>
        <a href="/parent" className="text-sm text-slate-500">
          Changer de profil
        </a>
      </header>
      <main className="px-6 pb-10">{children}</main>
    </div>
  );
}
