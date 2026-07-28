import { NextRequest, NextResponse } from "next/server";
import { requireChildSessionApi } from "@/lib/child-session";
import { prisma } from "@/lib/prisma";
import { checkAndAwardBadges } from "@/lib/badges";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const child = await requireChildSessionApi();
  if (!child) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const { correctAnswers, totalQuestions } = await req.json();

  const result = await prisma.result.create({
    data: {
      activityType: "COURS",
      childId: child.id,
      courseId: params.id,
      totalQuestions: totalQuestions ?? 0,
      correctAnswers: correctAnswers ?? 0,
      score:
        totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 100,
    },
  });

  const newBadges = await checkAndAwardBadges(child.id);

  return NextResponse.json({ ok: true, resultId: result.id, newBadges });
}
