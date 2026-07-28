import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function assertAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") return null;
  return session;
}

export async function GET() {
  const session = await assertAdmin();
  if (!session) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  const books = await prisma.referenceBook.findMany({
    include: { subject: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(books);
}

// POST /api/admin/reference-books
// { title, level, subjectId, content (texte collé), notes? }
export async function POST(req: NextRequest) {
  const session = await assertAdmin();
  if (!session) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  const body = await req.json();
  const { title, level, subjectId, content, notes } = body ?? {};

  if (!title || !level || !subjectId) {
    return NextResponse.json(
      { error: "title, level et subjectId sont requis." },
      { status: 400 }
    );
  }

  const book = await prisma.referenceBook.create({
    data: { title, level, subjectId, content, notes },
  });

  return NextResponse.json(book, { status: 201 });
}
