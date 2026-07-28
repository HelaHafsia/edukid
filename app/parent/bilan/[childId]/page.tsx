import { requireParent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

const ACTIVITY_LABELS: Record<string, string> = {
  COURS: "Apprentissage",
  QUIZ: "Quiz",
  EVALUATION: "Évaluation",
};

export default async function ChildBilanPage({
  params,
}: {
  params: { childId: string };
}) {
  const session = await requireParent();
  const parentId = (session.user as any).id as string;

  const child = await prisma.child.findFirst({
    where: { id: params.childId, parentId },
    include: {
      results: {
        orderBy: { completedAt: "desc" },
        include: {
          course: { select: { title: true, subject: { select: { code: true } } } },
          quiz: { select: { title: true, subject: { select: { code: true } } } },
          evaluation: { select: { title: true, subject: { select: { code: true } } } },
        },
      },
      childBadges: { include: { badge: true }, orderBy: { earnedAt: "desc" } },
    },
  });

  if (!child) notFound();

  // Regroupement par rubrique (activityType) pour le résumé du haut.
  const byType = { COURS: [] as typeof child.results, QUIZ: [] as typeof child.results, EVALUATION: [] as typeof child.results };
  for (const r of child.results) byType[r.activityType].push(r);

  const results = child.results; // extrait ici pour que TS applique le rétrécissement de type correctement
  const avg = (arr: typeof results): number | null => {
    if (arr.length === 0) return null;
    return Math.round(arr.reduce((s, r) => s + r.score, 0) / arr.length);
  };

  // Axes d'amélioration : skillTags manqués en évaluation, comptés par fréquence.
  const skillTagCounts: Record<string, number> = {};
  for (const r of byType.EVALUATION) {
    const tags = (r.improvementAreas as string[] | null) ?? [];
    for (const t of tags) skillTagCounts[t] = (skillTagCounts[t] ?? 0) + 1;
  }
  const improvementAreas = Object.entries(skillTagCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/parent/bilan" className="text-sm text-slate-500">
          ← Retour
        </Link>
        <h1 className="text-xl font-semibold text-slate-900 mt-1 mb-6">
          Bilan de {child.firstName} — {child.level}
        </h1>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {(["COURS", "QUIZ", "EVALUATION"] as const).map((type) => (
            <div key={type} className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">{ACTIVITY_LABELS[type]}</p>
              <p className="text-xl font-semibold text-slate-900">
                {avg(byType[type]) !== null ? `${avg(byType[type])}%` : "—"}
              </p>
              <p className="text-xs text-slate-400">{byType[type].length} activité(s)</p>
            </div>
          ))}
        </div>

        {improvementAreas.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-sm font-medium text-amber-900 mb-2">
              Axes d&apos;amélioration
            </p>
            <div className="flex flex-wrap gap-2">
              {improvementAreas.map(([tag, count]) => (
                <span
                  key={tag}
                  className="text-xs bg-white text-amber-800 rounded-full px-3 py-1 border border-amber-200"
                >
                  {tag} ({count})
                </span>
              ))}
            </div>
          </div>
        )}

        {child.childBadges.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-medium text-slate-700 mb-2">Badges obtenus</p>
            <div className="flex flex-wrap gap-2">
              {child.childBadges.map((cb) => (
                <div
                  key={cb.id}
                  className="bg-white border border-amber-200 rounded-full px-3 py-1.5 text-sm flex items-center gap-1"
                >
                  🏅 {cb.badge.label}
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-sm font-medium text-slate-700 mb-2">Historique</p>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {child.results.length === 0 && (
            <p className="px-4 py-3 text-sm text-slate-400">Aucune activité pour l&apos;instant.</p>
          )}
          {child.results.map((r) => {
            const title =
              r.course?.title ?? r.quiz?.title ?? r.evaluation?.title ?? "Activité";
            return (
              <div
                key={r.id}
                className="px-4 py-3 border-t border-slate-100 first:border-t-0 flex items-center justify-between text-sm"
              >
                <div>
                  <p className="font-medium text-slate-900">{title}</p>
                  <p className="text-slate-400 text-xs">
                    {ACTIVITY_LABELS[r.activityType]} ·{" "}
                    {new Date(r.completedAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <span className="font-semibold text-slate-700">{r.score}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}