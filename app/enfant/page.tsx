import { requireChildSession } from "@/lib/child-session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

const SUBJECT_LABELS: Record<string, string> = {
  FRANCAIS: "Français",
  MATHS: "Mathématiques",
  ARABE: "Arabe",
  ANGLAIS: "Anglais",
};

export default async function EnfantHomePage() {
  const child = await requireChildSession();

  // Le niveau de l'enfant (child.level) filtre AUTOMATIQUEMENT le contenu :
  // pas besoin de le lui redemander, il est déjà connu depuis sa création
  // par l'Admin.
  const subjects = await prisma.subject.findMany({
    where: {
      OR: [
        { courses: { some: { level: child.level } } },
        { quizzes: { some: { level: child.level } } },
        { evaluations: { some: { level: child.level } } },
      ],
    },
  });

  return (
    <div>
      <p className="text-sm text-slate-500 mb-6">
        Niveau : <span className="font-medium text-slate-700">{child.level}</span>
      </p>

      {subjects.length === 0 && (
        <p className="text-sm text-slate-500">
          Pas encore de contenu disponible pour ton niveau — reviens bientôt !
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 mb-8">
        {subjects.map((s) => (
          <div
            key={s.id}
            className="bg-white rounded-2xl border border-slate-200 p-5"
          >
            <p className="font-semibold text-slate-900 mb-3">
              {SUBJECT_LABELS[s.code] ?? s.name}
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href={`/enfant/apprentissage/${s.code}`}
                className="text-sm bg-emerald-50 text-emerald-700 rounded-lg px-3 py-2"
              >
                📘 Apprentissage
              </Link>
              <Link
                href={`/enfant/quiz/${s.code}`}
                className="text-sm bg-amber-50 text-amber-700 rounded-lg px-3 py-2"
              >
                ⚡ Quiz
              </Link>
              <Link
                href={`/enfant/evaluation/${s.code}`}
                className="text-sm bg-violet-50 text-violet-700 rounded-lg px-3 py-2"
              >
                🎯 Évaluation
              </Link>
            </div>
          </div>
        ))}
      </div>

      <Link
        href="/enfant/devoirs"
        className="block bg-slate-900 text-white rounded-2xl p-5 text-center font-medium"
      >
        📝 J&apos;ai un devoir à faire
      </Link>
    </div>
  );
}
