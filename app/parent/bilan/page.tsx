import { requireParent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function BilanListPage() {
  const session = await requireParent();
  const parentId = (session.user as any).id as string;

  const children = await prisma.child.findMany({
    where: { parentId },
    include: {
      results: true,
      childBadges: true,
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-slate-900">
            Bilan de progression
          </h1>
          <Link href="/parent" className="text-sm text-slate-500">
            ← Retour
          </Link>
        </div>

        {children.length === 0 && (
          <p className="text-sm text-slate-500">Aucun enfant pour l&apos;instant.</p>
        )}

        <div className="flex flex-col gap-3">
          {children.map((c) => {
            const avgScore =
              c.results.length > 0
                ? Math.round(
                    c.results.reduce((sum, r) => sum + r.score, 0) / c.results.length
                  )
                : null;
            return (
              <Link
                key={c.id}
                href={`/parent/bilan/${c.id}`}
                className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {c.firstName} — {c.level}
                  </p>
                  <p className="text-sm text-slate-500">
                    {c.results.length} activité(s) · {c.childBadges.length} badge(s)
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-slate-900">
                    {avgScore !== null ? `${avgScore}%` : "—"}
                  </p>
                  <p className="text-xs text-slate-400">score moyen</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
