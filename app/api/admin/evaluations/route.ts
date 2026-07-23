import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function assertAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") return null;
  return session;
}

export async function GET(req: NextRequest) {
  const session = await assertAdmin();
  if (!session) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  const subjectCode = req.nextUrl.searchParams.get("subjectCode") ?? undefined;
  const level = req.nextUrl.searchParams.get("level") ?? undefined;

  const evaluations = await prisma.evaluation.findMany({
    where: {
      level: level as any,
      subject: subjectCode ? { code: subjectCode as any } : undefined,
    },
    include: { subject: true, questions: true },
    orderBy: [{ level: "asc" }],
  });

  return NextResponse.json(evaluations);
}

// POST /api/admin/evaluations
// { title, level, subjectId, questions?: [{question, choices?, answer, hint?, skillTag}] }
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

  for (const q of questions ?? []) {
    if (!q.skillTag) {
      return NextResponse.json(
        { error: `skillTag manquant pour la question: "${q.question}"` },
        { status: 400 }
      );
    }
  }

  const evaluation = await prisma.evaluation.create({
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
              skillTag: q.skillTag,
              order: q.order ?? i,
            })),
          }
        : undefined,
    },
    include: { questions: true },
  });

  return NextResponse.json(evaluation, { status: 201 });
}
