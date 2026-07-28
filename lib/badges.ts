import { prisma } from "./prisma";

// ----------------------------------------------------------------------------
// EduKid — Moteur de badges
//
// Règles simples, évaluées après chaque Result créé (cours/quiz/évaluation
// terminé). Chaque badge est défini par un code unique (aligné avec le
// modèle Badge en base, créé par prisma/seed.ts) et une fonction de
// vérification. Un badge n'est jamais attribué deux fois (contrainte unique
// childId+badgeId en base).
// ----------------------------------------------------------------------------

export const BADGE_DEFINITIONS = [
  {
    code: "FIRST_COURSE",
    label: "Premier pas",
    description: "A terminé son premier cours.",
  },
  {
    code: "QUIZ_MASTER_80",
    label: "As du quiz",
    description: "A réussi 5 quiz avec plus de 80% de bonnes réponses.",
  },
  {
    code: "STREAK_7",
    label: "Régulier",
    description: "S'est entraîné pendant 7 jours différents.",
  },
  {
    code: "FIRST_EVALUATION",
    label: "Première évaluation",
    description: "A terminé sa première évaluation.",
  },
] as const;

export async function checkAndAwardBadges(childId: string): Promise<string[]> {
  const newlyAwarded: string[] = [];

  const [results, existingBadges] = await Promise.all([
    prisma.result.findMany({ where: { childId } }),
    prisma.childBadge.findMany({ where: { childId }, select: { badge: { select: { code: true } } } }),
  ]);

  const alreadyHas = new Set(existingBadges.map((b) => b.badge.code));

  async function award(code: string) {
    if (alreadyHas.has(code)) return;
    const badge = await prisma.badge.findUnique({ where: { code } });
    if (!badge) return; // pas encore seedé
    await prisma.childBadge.create({ data: { childId, badgeId: badge.id } }).catch(() => {
      // déjà attribué en parallèle, ignore
    });
    newlyAwarded.push(code);
  }

  // FIRST_COURSE : au moins un Result de type COURS
  if (results.some((r) => r.activityType === "COURS")) {
    await award("FIRST_COURSE");
  }

  // FIRST_EVALUATION : au moins un Result de type EVALUATION
  if (results.some((r) => r.activityType === "EVALUATION")) {
    await award("FIRST_EVALUATION");
  }

  // QUIZ_MASTER_80 : au moins 5 quiz avec score >= 80
  const highScoreQuizzes = results.filter(
    (r) => r.activityType === "QUIZ" && r.score >= 80
  );
  if (highScoreQuizzes.length >= 5) {
    await award("QUIZ_MASTER_80");
  }

  // STREAK_7 : activité sur au moins 7 jours calendaires différents
  const distinctDays = new Set(
    results.map((r) => r.completedAt.toISOString().slice(0, 10))
  );
  if (distinctDays.size >= 7) {
    await award("STREAK_7");
  }

  return newlyAwarded;
}
