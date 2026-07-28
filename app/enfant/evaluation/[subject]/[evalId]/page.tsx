import { requireChildSession } from "@/lib/child-session";
import { prisma } from "@/lib/prisma";
import { toSafeEvaluationQuestion } from "@/lib/assessment-service";
import { EvaluationRunner } from "./evaluation-runner";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EvaluationPage({
  params,
}: {
  params: { subject: string; evalId: string };
}) {
  await requireChildSession();

  const evaluation = await prisma.evaluation.findUnique({
    where: { id: params.evalId },
    select: {
      id: true,
      title: true,
      questions: {
        orderBy: { order: "asc" },
        select: { id: true, question: true, choices: true, order: true, skillTag: true },
      },
    },
  });

  if (!evaluation) notFound();

  const safeQuestions = evaluation.questions.map(toSafeEvaluationQuestion);

  return (
    <div>
      <p className="text-sm text-slate-500 mb-1">
        <Link href={`/enfant/evaluation/${params.subject}`}>← Retour</Link>
      </p>
      <EvaluationRunner
        evaluationId={evaluation.id}
        title={evaluation.title}
        questions={safeQuestions}
      />
    </div>
  );
}
