import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function assertAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") return null;
  return session;
}

// GET : vue Admin uniquement -> ici on PEUT inclure `answer`, car c'est
// l'écran d'édition de contenu par l'Admin, pas un écran consommé par
// l'enfant. Les routes /api/child/* (à construire ensuite) devront, elles,
// utiliser toSafeQuizQuestion() de lib/assessment-service.ts.
export async function GET(req: NextRequest) {
  const session = await assertAdmin();
  if (!session) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  const subjectCode = req.nextUrl.searchParams.get("subjectCode") ?? undefined;
  const level = req.nextUrl.searchParams.get("level") ?? undefined;

  const quizzes = await prisma.quiz.findMany({
    where: {
      level: level as any,
      subject: subjectCode ? { code: subjectCode as any } : undefined,
    },
    include: { subject: true, questions: true },
    orderBy: [{ level: "asc" }],
  });

  return NextResponse.json(quizzes);
}

// POST /api/admin/quizzes
// { title, level, subjectId, questions?: [{question, choices?, answer, hint?}] }
export async function POST(req: NextRequest) {
  const session = await assertAdmin();
  if (!session) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  const body = await req.json();
  const { title, level, subjectId, questions } = body ?? {};

  if (!title || !level || !subjectId) {
    return NextResponse.json(
      { error: "title, level et subjectId sont requis." },
      { status: 400 }
    );
  }

  const quiz = await prisma.quiz.create({
    data: {
      title,
      level,
      subjectId,
      questions: questions?.length
        ? {
            create: questions.map((q: any, i: number) => ({
              question: q.question,
              choices: q.choices ?? undefined,
              answer: q.answer,
              hint: q.hint ?? null,
              order: q.order ?? i,
            })),
          }
        : undefined,
    },
    include: { questions: true },
  });

  return NextResponse.json(quiz, { status: 201 });
}
