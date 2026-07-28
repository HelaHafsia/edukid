import { NextRequest, NextResponse } from "next/server";
import { requireChildSessionApi } from "@/lib/child-session";
import { gradeEvaluationQuestion } from "@/lib/assessment-service";

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

  // gradeEvaluationQuestion ne renvoie JAMAIS `answer`, uniquement
  // isCorrect + hint + skillTag (pour construire le bilan).
  const result = await gradeEvaluationQuestion(params.id, answer);
  return NextResponse.json(result);
}
