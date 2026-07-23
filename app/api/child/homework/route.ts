import { NextRequest, NextResponse } from "next/server";
import { requireChildSessionApi } from "@/lib/child-session";
import { prisma } from "@/lib/prisma";

// ============================================================================
// POST /api/child/homework
// L'enfant saisit l'énoncé de son devoir (texte libre). On envoie ça à
// Claude avec le niveau de l'enfant, pour :
//   1. détecter la matière (Français/Maths/Arabe/Anglais) et confirmer le
//      niveau,
//   2. générer 3 à 5 exercices d'ENTRAÎNEMENT similaires (pas l'exercice de
//      l'école lui-même : des exercices du même type, pour s'entraîner).
//
// IMPORTANT (cohérence avec la règle métier) : ces exercices générés sont
// assimilés à de la PRATIQUE (comme le module Apprentissage) : ils incluent
// donc une correction complète, pour que l'enfant apprenne en s'entraînant
// seul avant de refaire son vrai devoir.
//
// Nécessite la variable d'environnement ANTHROPIC_API_KEY.
// ============================================================================

const SYSTEM_PROMPT = `Tu es un assistant pédagogique pour des enfants du primaire français (niveaux CP à CM2).
On te donne l'énoncé d'un devoir donné par l'école, tel que saisi par un enfant ou son parent
(fautes de frappe possibles, formulation informelle).

Ta tâche :
1. Identifier la matière : FRANCAIS, MATHS, ARABE ou ANGLAIS.
2. Identifier le niveau probable si ce n'est pas déjà donné (CP, CE1, CE2, CM1, CM2).
3. Générer entre 3 et 5 exercices d'ENTRAÎNEMENT du même type que le devoir
   (jamais l'exercice exact du devoir, mais des exercices similaires pour
   s'entraîner), adaptés à un enfant de cet âge, avec un langage simple et
   bienveillant.

Réponds UNIQUEMENT en JSON valide, sans texte avant/après, sans balises markdown, au format exact :
{
  "subjectCode": "FRANCAIS" | "MATHS" | "ARABE" | "ANGLAIS",
  "level": "CP" | "CE1" | "CE2" | "CM1" | "CM2",
  "exercises": [
    {
      "question": "string",
      "choices": ["string", "string", "string", "string"] ou null si pas un QCM,
      "answer": "string",
      "explanation": "string (explication simple de la correction)"
    }
  ]
}`;

export async function POST(req: NextRequest) {
  const child = await requireChildSessionApi();
  if (!child) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const body = await req.json();
  const { statement } = body ?? {};

  if (!statement || typeof statement !== "string" || statement.trim().length < 5) {
    return NextResponse.json(
      { error: "Merci de décrire un peu plus le devoir." },
      { status: 400 }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error:
          "L'aide aux devoirs par IA n'est pas encore configurée (clé API manquante).",
      },
      { status: 503 }
    );
  }

  let generated: {
    subjectCode: string;
    level: string;
    exercises: {
      question: string;
      choices: string[] | null;
      answer: string;
      explanation: string;
    }[];
  };

  try {
    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Niveau de l'enfant (indicatif) : ${child.level}.\nÉnoncé du devoir : """${statement}"""`,
          },
        ],
      }),
    });

    if (!aiRes.ok) {
      throw new Error(`Anthropic API error: ${aiRes.status}`);
    }

    const data = await aiRes.json();
    const text = data.content?.find((b: any) => b.type === "text")?.text ?? "";
    const cleaned = text.replace(/```json|```/g, "").trim();
    generated = JSON.parse(cleaned);
  } catch (err) {
    console.error("Homework AI error:", err);
    return NextResponse.json(
      { error: "Impossible de générer les exercices pour l'instant, réessaie." },
      { status: 502 }
    );
  }

  const homework = await prisma.homeworkRequest.create({
    data: {
      rawStatement: statement,
      childId: child.id,
      detectedLevel: (generated.level as any) ?? child.level,
      detectedSubjectCode: generated.subjectCode as any,
      generatedExercises: generated.exercises as any,
    },
  });

  return NextResponse.json({
    id: homework.id,
    subjectCode: generated.subjectCode,
    level: generated.level,
    exercises: generated.exercises,
  });
}
