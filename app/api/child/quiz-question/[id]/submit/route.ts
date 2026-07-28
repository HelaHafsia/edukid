import { NextRequest, NextResponse } from "next/server";
import { requireChildSessionApi } from "@/lib/child-session";
import { gradeQuizQuestion } from "@/lib/assessment-service";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const child = await requireChildSessionApi();
  if (!child) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const { answer } = await req.json();
  if (typeof answer !== "string") {
    return NextResponse.json({ error: "Réponse requise." }, { status: 400 });
  }

  // gradeQuizQuestion ne renvoie JAMAIS `answer`, uniquement isCorrect + hint.
  const result = await gradeQuizQuestion(params.id, answer);
  return NextResponse.json(result);
}
