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

// GET /api/admin/children?parentId=xxx  (parentId optionnel : filtre)
export async function GET(req: NextRequest) {
  const session = await assertAdmin();
  if (!session) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  const parentId = req.nextUrl.searchParams.get("parentId") ?? undefined;

  const children = await prisma.child.findMany({
    where: parentId ? { parentId } : undefined,
    select: {
      id: true,
      firstName: true,
      level: true,
      avatarUrl: true,
      parent: { select: { id: true, name: true, email: true } },
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(children);
}

// POST /api/admin/children  { firstName, level, parentId, avatarUrl?, pin? }
export async function POST(req: NextRequest) {
  const session = await assertAdmin();
  if (!session) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  const body = await req.json();
  const { firstName, level, parentId, avatarUrl, pin } = body ?? {};

  if (!firstName || !level || !parentId) {
    return NextResponse.json(
      { error: "firstName, level et parentId sont requis." },
      { status: 400 }
    );
  }

  const parent = await prisma.user.findFirst({
    where: { id: parentId, role: "PARENT" },
  });
  if (!parent) {
    return NextResponse.json({ error: "Parent introuvable." }, { status: 404 });
  }

  const pinHash = pin ? await hashPin(pin) : undefined;

  const child = await prisma.child.create({
    data: { firstName, level, parentId, avatarUrl, pinHash },
    select: { id: true, firstName: true, level: true, avatarUrl: true },
  });

  return NextResponse.json(child, { status: 201 });
}
