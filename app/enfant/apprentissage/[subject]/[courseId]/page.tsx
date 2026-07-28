import { requireChildSession } from "@/lib/child-session";
import { prisma } from "@/lib/prisma";
import { CourseRunner } from "./course-runner";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function CoursePage({
  params,
}: {
  params: { subject: string; courseId: string };
}) {
  await requireChildSession();

  const course = await prisma.course.findUnique({
    where: { id: params.courseId },
    select: {
      id: true,
      title: true,
      content: true,
      exercises: {
        orderBy: { order: "asc" },
        select: { id: true, question: true, choices: true, hint: true },
      },
    },
  });

  if (!course) notFound();

  return (
    <div>
      <p className="text-sm text-slate-500 mb-1">
        <Link href={`/enfant/apprentissage/${params.subject}`}>← Retour</Link>
      </p>
      <CourseRunner course={course} />
    </div>
  );
}
