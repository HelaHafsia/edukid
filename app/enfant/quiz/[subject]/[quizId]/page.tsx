import { requireChildSession } from "@/lib/child-session";
import { prisma } from "@/lib/prisma";
import { toSafeQuizQuestion } from "@/lib/assessment-service";
import { QuizRunner } from "./quiz-runner";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function QuizPage({
  params,
}: {
  params: { subject: string; quizId: string };
}) {
  await requireChildSession();

  const quiz = await prisma.quiz.findUnique({
    where: { id: params.quizId },
    select: {
      id: true,
      title: true,
      questions: {
        orderBy: { order: "asc" },
        select: { id: true, question: true, choices: true, order: true },
      },
    },
  });

  if (!quiz) notFound();

  // Defense-in-depth : on ne renvoie jamais `answer` au client, même par erreur.
  const safeQuestions = quiz.questions.map(toSafeQuizQuestion);

  return (
    <div>
      <p className="text-sm text-slate-500 mb-1">
        <Link href={`/enfant/quiz/${params.subject}`}>← Retour</Link>
      </p>
      <QuizRunner quizId={quiz.id} title={quiz.title} questions={safeQuestions} />
    </div>
  );
}
