import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ============================================================================
// POST /api/admin/generate-content
// Génère un brouillon de cours/quiz/évaluation avec Claude, pour que l'Admin
// n'ait plus qu'à relire/ajuster avant de sauvegarder (au lieu de tout taper
// à la main). S'appuie en priorité sur les manuels de référence existants
// pour ce niveau/matière, s'il y en a.
//
// body: { type: "cours" | "quiz" | "evaluation", subjectCode, level, topic }
// ============================================================================

const PROMPTS: Record<string, string> = {
  cours: `Tu es un enseignant du primaire français. On te donne une matière, un niveau (CP à CM2) et un thème.
Rédige :
1. Un titre court pour le cours.
2. Un contenu de cours (3 à 6 phrases, adapté à l'âge, clair, bienveillant, à lire à voix haute à l'enfant).
3. Entre 3 et 5 exercices de PRATIQUE avec correction complète (c'est autorisé ici, c'est le module Apprentissage).

Réponds UNIQUEMENT en JSON valide, sans texte avant/après, sans markdown :
{
  "title": "string",
  "content": "string",
  "exercises": [
    { "question": "string", "choices": ["string","string","string","string"] ou null, "answer": "string", "hint": "string ou null", "explanation": "string" }
  ]
}`,
  quiz: `Tu es un enseignant du primaire français. On te donne une matière, un niveau (CP à CM2) et un thème.
Génère un quiz de 4 à 6 questions rapides sur ce thème, adapté à l'âge.
IMPORTANT : dans ce module, l'enfant ne doit JAMAIS voir la réponse en cas d'erreur, seulement un indice. Le "hint" doit donc être une aide qui guide SANS révéler la réponse.

Réponds UNIQUEMENT en JSON valide, sans texte avant/après, sans markdown :
{
  "title": "string",
  "questions": [
    { "question": "string", "choices": ["string","string","string","string"] ou null, "answer": "string", "hint": "string" }
  ]
}`,
  evaluation: `Tu es un enseignant du primaire français. On te donne une matière, un niveau (CP à CM2) et un thème.
Génère une évaluation de 4 à 6 questions sur ce thème, adaptée à l'âge, avec pour chaque question une "skillTag" courte en kebab-case identifiant précisément la compétence testée (ex: "addition-simple", "reconnaissance-lettres").
IMPORTANT : l'enfant ne doit JAMAIS voir la réponse en cas d'erreur, seulement un indice qui guide sans révéler la réponse.

Réponds UNIQUEMENT en JSON valide, sans texte avant/après, sans markdown :
{
  "title": "string",
  "questions": [
    { "question": "string", "choices": ["string","string","string","string"] ou null, "answer": "string", "hint": "string", "skillTag": "string" }
  ]
}`,
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Génération IA non configurée (clé API manquante)." },
      { status: 503 }
    );
  }

  const { type, subjectCode, level, topic } = await req.json();

  if (!type || !PROMPTS[type] || !subjectCode || !level || !topic) {
    return NextResponse.json(
      { error: "type, subjectCode, level et topic sont requis." },
      { status: 400 }
    );
  }

  const referenceBooks = await prisma.referenceBook.findMany({
    where: { level, subject: { code: subjectCode }, content: { not: null } },
    select: { title: true, content: true },
    take: 2,
  });

  const referenceContext =
    referenceBooks.length > 0
      ? `\n\nExtraits de manuels de référence à utiliser comme base :\n${referenceBooks
          .map((b) => `--- ${b.title} ---\n${b.content?.slice(0, 3000)}`)
          .join("\n\n")}`
      : "";

  try {
    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1800,
        system: PROMPTS[type],
        messages: [
          {
            role: "user",
            content: `Matière : ${subjectCode}\nNiveau : ${level}\nThème : ${topic}${referenceContext}`,
          },
        ],
      }),
    });

    if (!aiRes.ok) {
      const errorBody = await aiRes.text().catch(() => "");
      throw new Error(`Anthropic API error: ${aiRes.status} — ${errorBody}`);
    }

    const data = await aiRes.json();
    const text = data.content?.find((b: any) => b.type === "text")?.text ?? "";
    const cleaned = text.replace(/```json|```/g, "").trim();
    const generated = JSON.parse(cleaned);

    return NextResponse.json(generated);
  } catch (err) {
    console.error("Content generation AI error:", err);
    return NextResponse.json(
      { error: "Impossible de générer le contenu pour l'instant, réessaie." },
      { status: 502 }
    );
  }
}
