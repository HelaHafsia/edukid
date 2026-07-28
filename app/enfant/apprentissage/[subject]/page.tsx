import { requireChildSession } from "@/lib/child-session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

const SUBJECT_LABELS: Record<string, string> = {
  FRANCAIS: "Français",
  MATHS: "Mathématiques",
  ARABE: "Arabe",
  ANGLAIS: "Anglais",
};

export default async function ApprentissageSubjectPage({
  params,
}: {
  params: { subject: string };
}) {
  const child = await requireChildSession();

  const courses = await prisma.course.findMany({
    where: {
      level: child.level,
      subject: { code: params.subject as any },
    },
    orderBy: { order: "asc" },
    select: { id: true, title: true },
  });

  return (
    <div>
      <p className="text-sm text-slate-500 mb-1">
        <Link href="/enfant">← Retour</Link>
      </p>
      <h1 className="text-lg font-semibold text-slate-900 mb-4">
        Apprentissage — {SUBJECT_LABELS[params.subject] ?? params.subject}
      </h1>

      {courses.length === 0 && (
        <p className="text-sm text-slate-500">
          Pas encore de cours disponible pour ton niveau.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {courses.map((c) => (
          <Link
            key={c.id}
            href={`/enfant/apprentissage/${params.subject}/${c.id}`}
            className="bg-white border border-slate-200 rounded-2xl p-5 font-medium text-slate-900"
          >
            📘 {c.title}
          </Link>
        ))}
      </div>
    </div>
  );
}
