import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

async function assertAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") return null;
  return session;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await assertAdmin();
  if (!session) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  const parent = await prisma.user.findFirst({
    where: { id: params.id, role: "PARENT" },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      children: { select: { id: true, firstName: true, level: true } },
    },
  });

  if (!parent) {
    return NextResponse.json({ error: "Parent introuvable." }, { status: 404 });
  }
  return NextResponse.json(parent);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await assertAdmin();
  if (!session) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.name) data.name = body.name;
  if (body.email) data.email = body.email.toLowerCase().trim();
  if (body.password) {
    if (body.password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères." },
        { status: 400 }
      );
    }
    data.passwordHash = await hashPassword(body.password);
  }

  const parent = await prisma.user
    .update({
      where: { id: params.id },
      data,
      select: { id: true, name: true, email: true },
    })
    .catch(() => null);

  if (!parent) {
    return NextResponse.json({ error: "Parent introuvable." }, { status: 404 });
  }
  return NextResponse.json(parent);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await assertAdmin();
  if (!session) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  // La suppression cascade sur Child (voir schema: onDelete: Cascade),
  // donc sur Result/ChildBadge/HomeworkRequest également.
  await prisma.user
    .delete({ where: { id: params.id, role: "PARENT" } as any })
    .catch(() => null);

  return NextResponse.json({ ok: true });
}
