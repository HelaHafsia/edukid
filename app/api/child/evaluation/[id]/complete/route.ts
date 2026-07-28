import { NextRequest, NextResponse } from "next/server";
import { requireChildSessionApi } from "@/lib/child-session";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const child = await requireChildSessionApi();
  if (!child) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const { correctAnswers, totalQuestions, missedSkillTags } = await req.json();

  const result = await prisma.result.create({
    data: {
      activityType: "EVALUATION",
      childId: child.id,
      evaluationId: params.id,
      totalQuestions,
      correctAnswers,
      score: totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0,
      improvementAreas: missedSkillTags ?? [],
    },
  });

  return NextResponse.json({ ok: true, resultId: result.id });
}
