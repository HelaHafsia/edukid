import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { SignOutButton } from "./sign-out-button";

const NAV_ITEMS = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/parents", label: "Parents" },
  { href: "/admin/enfants", label: "Enfants" },
  { href: "/admin/contenu", label: "Contenu pédagogique" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin(); // redirige vers /connexion si pas ADMIN

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-60 shrink-0 border-r border-slate-200 bg-white flex flex-col">
        <div className="px-5 py-5 border-b border-slate-200">
          <p className="text-sm font-semibold text-slate-900">EduKid</p>
          <p className="text-xs text-slate-500">Espace Admin</p>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-slate-700 hover:bg-slate-100 rounded-lg px-3 py-2"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-slate-200">
          <p className="text-xs text-slate-500 mb-2 truncate">
            {(session.user as any).email}
          </p>
          <SignOutButton />
        </div>
      </aside>

      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
