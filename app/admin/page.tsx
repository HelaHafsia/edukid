import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const [parentsCount, childrenCount, coursesCount, quizzesCount, evaluationsCount] =
    await Promise.all([
      prisma.user.count({ where: { role: "PARENT" } }),
      prisma.child.count(),
      prisma.course.count(),
      prisma.quiz.count(),
      prisma.evaluation.count(),
    ]);

  const stats = [
    { label: "Parents", value: parentsCount },
    { label: "Enfants", value: childrenCount },
    { label: "Cours", value: coursesCount },
    { label: "Quiz / Évaluations", value: quizzesCount + evaluationsCount },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900 mb-6">
        Tableau de bord
      </h1>

      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl border border-slate-200 p-4"
          >
            <p className="text-sm text-slate-500 mb-1">{s.label}</p>
            <p className="text-2xl font-semibold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      {parentsCount === 0 && (
        <p className="mt-8 text-sm text-slate-500">
          Aucun parent pour l&apos;instant.{" "}
          <a href="/admin/parents" className="underline">
            Crée le premier compte Parent
          </a>{" "}
          pour commencer.
        </p>
      )}
    </div>
  );
}
