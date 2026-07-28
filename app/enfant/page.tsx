import { requireChildSession } from "@/lib/child-session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

const SUBJECT_LABELS: Record<string, string> = {
  FRANCAIS: "Français",
  MATHS: "Mathématiques",
  ARABE: "Arabe",
  ANGLAIS: "Anglais",
};

const SUBJECT_EMOJI: Record<string, string> = {
  FRANCAIS: "📖",
  MATHS: "🔢",
  ARABE: "🌙",
  ANGLAIS: "🌍",
};

const SUBJECT_BG: Record<string, string> = {
  FRANCAIS: "from-rose-200 to-rose-50",
  MATHS: "from-sky-200 to-sky-50",
  ARABE: "from-amber-200 to-amber-50",
  ANGLAIS: "from-emerald-200 to-emerald-50",
};

export default async function EnfantHomePage() {
  const child = await requireChildSession();

  const [subjects, badges] = await Promise.all([
    prisma.subject.findMany({
      where: {
        OR: [
          { courses: { some: { level: child.level } } },
          { quizzes: { some: { level: child.level } } },
          { evaluations: { some: { level: child.level } } },
        ],
      },
    }),
    prisma.childBadge.findMany({
      where: { childId: child.id },
      include: { badge: true },
      orderBy: { earnedAt: "desc" },
    }),
  ]);

  return (
    <div>
      {badges.length > 0 && (
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          {badges.map((cb) => (
            <div
              key={cb.id}
              className="shrink-0 bg-white rounded-2xl shadow-sm px-4 py-3 flex items-center gap-2 border border-amber-200"
              title={cb.badge.description}
            >
              <span className="text-2xl">🏅</span>
              <span className="text-sm font-semibold text-amber-800">
                {cb.badge.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {subjects.length === 0 && (
        <p className="text-sm text-slate-500">
          Pas encore de contenu disponible pour ton niveau — reviens bientôt !
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 mb-8">
        {subjects.map((s) => (
          <div
            key={s.id}
            className={`bg-gradient-to-br ${
              SUBJECT_BG[s.code] ?? "from-slate-200 to-slate-50"
            } rounded-3xl p-5 shadow-sm`}
          >
            <p className="font-extrabold text-lg text-slate-900 mb-3 flex items-center gap-2">
              <span className="text-2xl">{SUBJECT_EMOJI[s.code] ?? "⭐"}</span>
              {SUBJECT_LABELS[s.code] ?? s.name}
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href={`/enfant/apprentissage/${s.code}`}
                className="text-sm font-semibold bg-white/80 hover:bg-white text-emerald-700 rounded-2xl px-3 py-2.5 text-center shadow-sm"
              >
                📘 Apprendre
              </Link>
              <Link
                href={`/enfant/quiz/${s.code}`}
                className="text-sm font-semibold bg-white/80 hover:bg-white text-amber-700 rounded-2xl px-3 py-2.5 text-center shadow-sm"
              >
                ⚡ Quiz
              </Link>
              <Link
                href={`/enfant/evaluation/${s.code}`}
                className="text-sm font-semibold bg-white/80 hover:bg-white text-violet-700 rounded-2xl px-3 py-2.5 text-center shadow-sm"
              >
                🎯 Évaluation
              </Link>
            </div>
          </div>
        ))}
      </div>

      <Link
        href="/enfant/devoirs"
        className="block bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-3xl p-6 text-center shadow-md"
      >
        <span className="text-3xl block mb-1">📝</span>
        <span className="font-bold text-lg">J&apos;ai un devoir à faire !</span>
      </Link>
    </div>
  );
}
