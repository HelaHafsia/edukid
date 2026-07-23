import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

// ----------------------------------------------------------------------------
// GET  /api/admin/parents        -> liste des comptes Parent
// POST /api/admin/parents        -> création d'un compte Parent
// Accès : ADMIN uniquement.
// ----------------------------------------------------------------------------

async function assertAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await assertAdmin();
  if (!session) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const parents = await prisma.user.findMany({
    where: { role: "PARENT" },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      children: { select: { id: true, firstName: true, level: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(parents);
}

export async function POST(req: NextRequest) {
  const session = await assertAdmin();
  if (!session) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const body = await req.json();
  const { name, email, password } = body ?? {};

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "name, email et password sont requis." },
      { status: 400 }
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Le mot de passe doit contenir au moins 8 caractères." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Un compte existe déjà avec cet email." },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);

  const parent = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase().trim(),
      passwordHash,
      role: "PARENT",
      createdById: (session.user as any).id,
    },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  return NextResponse.json(parent, { status: 201 });
}
