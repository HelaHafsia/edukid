import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPin } from "@/lib/password";

async function assertAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") return null;
  return session;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await assertAdmin();
  if (!session) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.firstName) data.firstName = body.firstName;
  if (body.level) data.level = body.level;
  if (body.avatarUrl !== undefined) data.avatarUrl = body.avatarUrl;
  if (body.pin) data.pinHash = await hashPin(body.pin);

  const child = await prisma.child
    .update({ where: { id: params.id }, data })
    .catch(() => null);

  if (!child) return NextResponse.json({ error: "Enfant introuvable." }, { status: 404 });
  return NextResponse.json(child);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await assertAdmin();
  if (!session) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  await prisma.child.delete({ where: { id: params.id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
