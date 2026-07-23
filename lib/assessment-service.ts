import { prisma } from "./prisma";

// ============================================================================
// EduKid — Service d'évaluation des réponses
//
// RÈGLE MÉTIER CRITIQUE (à ne jamais violer) :
//   - Apprentissage (Exercise) : en cas d'erreur -> on PEUT renvoyer la
//     correction complète (answer) + explication.
//   - Quiz (QuizQuestion) et Évaluation (EvaluationQuestion) : en cas d'erreur
//     -> on ne renvoie JAMAIS answer, uniquement hint.
//
// Toute cette logique est centralisée ICI, côté serveur, précisément pour
// qu'aucune route API ne puisse "oublier" la règle et fuiter une réponse.
// Les routes API doivent appeler ces fonctions plutôt que de lire
// directement `answer` sur les modèles Quiz/Evaluation.
// ============================================================================

type GradeResult = {
  isCorrect: boolean;
  /** Uniquement pour Apprentissage : correction complète. */
  explanation?: string;
  /** Pour Quiz/Évaluation en cas d'erreur, et en soutien pour Apprentissage. */
  hint?: string | null;
  /** Uniquement pour Évaluation : utilisé pour construire le bilan. */
  skillTag?: string;
};

// --- APPRENTISSAGE : correction complète autorisée --------------------------

export async function gradePracticeExercise(
  exerciseId: string,
  submittedAnswer: string
): Promise<GradeResult> {
  const exercise = await prisma.exercise.findUniqueOrThrow({
    where: { id: exerciseId },
  });

  const isCorrect = normalize(submittedAnswer) === normalize(exercise.answer);

  return {
    isCorrect,
    // Autorisé ici : on donne toujours l'explication complète si erreur,
    // pour que l'enfant comprenne et apprenne.
    explanation: isCorrect ? undefined : exercise.explanation,
    hint: exercise.hint ?? undefined,
  };
}

// --- QUIZ : jamais la réponse, hint seulement --------------------------------

export async function gradeQuizQuestion(
  questionId: string,
  submittedAnswer: string
): Promise<GradeResult> {
  const question = await prisma.quizQuestion.findUniqueOrThrow({
    where: { id: questionId },
  });

  const isCorrect = normalize(submittedAnswer) === normalize(question.answer);

  return {
    isCorrect,
    // IMPORTANT : ne JAMAIS inclure `question.answer` ici, même en cas
    // d'erreur. Seul le hint est renvoyable au client.
    hint: isCorrect ? undefined : question.hint,
  };
}

// --- ÉVALUATION : jamais la réponse, hint + skillTag pour le bilan ---------

export async function gradeEvaluationQuestion(
  questionId: string,
  submittedAnswer: string
): Promise<GradeResult> {
  const question = await prisma.evaluationQuestion.findUniqueOrThrow({
    where: { id: questionId },
  });

  const isCorrect = normalize(submittedAnswer) === normalize(question.answer);

  return {
    isCorrect,
    // IMPORTANT : jamais `question.answer`, même en cas d'erreur.
    hint: isCorrect ? undefined : question.hint,
    skillTag: question.skillTag,
  };
}

// ----------------------------------------------------------------------------
// Sérialiseurs "safe" à utiliser pour charger un Quiz/Évaluation côté client
// AVANT que l'enfant ait répondu : ils retirent systématiquement `answer`
// du payload envoyé au navigateur (defense-in-depth, en plus des routes
// dédiées ci-dessus).
// ----------------------------------------------------------------------------

export function toSafeQuizQuestion(q: {
  id: string;
  question: string;
  choices: unknown;
  order: number;
}) {
  return { id: q.id, question: q.question, choices: q.choices, order: q.order };
}

export function toSafeEvaluationQuestion(q: {
  id: string;
  question: string;
  choices: unknown;
  order: number;
  skillTag: string;
}) {
  return {
    id: q.id,
    question: q.question,
    choices: q.choices,
    order: q.order,
    skillTag: q.skillTag,
  };
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}
