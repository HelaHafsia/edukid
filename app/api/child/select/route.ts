import { NextRequest, NextResponse } from "next/server";
import { requireOwnChildApi } from "@/lib/auth";
import { setChildSession } from "@/lib/child-session";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// POST /api/child/select  { childId, pin? }
// Vérifie que l'enfant appartient bien au parent connecté (requireOwnChildApi),
// vérifie le PIN si l'enfant en a un, puis pose le cookie de session enfant.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { childId, pin } = body ?? {};

  if (!childId) {
    return NextResponse.json({ error: "childId requis." }, { status: 400 });
  }

  const result = await requireOwnChildApi(childId);
  if (!result) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }
  const { child } = result;

  const full = await prisma.child.findUnique({ where: { id: child.id } });

  if (full?.pinHash) {
    if (!pin) {
      return NextResponse.json({ error: "PIN requis." }, { status: 400 });
    }
    const valid = await bcrypt.compare(pin, full.pinHash);
    if (!valid) {
      return NextResponse.json({ error: "PIN incorrect." }, { status: 401 });
    }
  }

  setChildSession(child.id);
  return NextResponse.json({ ok: true });
}
