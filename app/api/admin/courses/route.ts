import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function assertAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") return null;
  return session;
}

// GET /api/admin/courses?subjectCode=MATHS&level=CE1
export async function GET(req: NextRequest) {
  const session = await assertAdmin();
  if (!session) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  const subjectCode = req.nextUrl.searchParams.get("subjectCode") ?? undefined;
  const level = req.nextUrl.searchParams.get("level") ?? undefined;

  const courses = await prisma.course.findMany({
    where: {
      level: level as any,
      subject: subjectCode ? { code: subjectCode as any } : undefined,
    },
    include: { subject: true, exercises: true },
    orderBy: [{ level: "asc" }, { order: "asc" }],
  });

  return NextResponse.json(courses);
}

// POST /api/admin/courses
// { title, level, content, subjectId, exercises?: [{question, choices?, answer, hint?, explanation}] }
// -> C'est ICI, et UNIQUEMENT ici (Course/Exercise), que "answer" + "explanation"
//    sont légitimement stockés et pourront être renvoyés en cas d'erreur, car
//    ce module relève de l'Apprentissage (correction complète autorisée).
export async function POST(req: NextRequest) {
  const session = await assertAdmin();
  if (!session) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  const body = await req.json();
  const { title, level, content, subjectId, exercises } = body ?? {};

  if (!title || !level || !content || !subjectId) {
    return NextResponse.json(
      { error: "title, level, content et subjectId sont requis." },
      { status: 400 }
    );
  }

  const course = await prisma.course.create({
    data: {
      title,
      level,
      content,
      subjectId,
      exercises: exercises?.length
        ? {
            create: exercises.map((ex: any, i: number) => ({
              question: ex.question,
              choices: ex.choices ?? undefined,
              answer: ex.answer,
              hint: ex.hint ?? null,
              explanation: ex.explanation,
              order: ex.order ?? i,
            })),
          }
        : undefined,
    },
    include: { exercises: true },
  });

  return NextResponse.json(course, { status: 201 });
}
