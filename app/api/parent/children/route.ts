import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "PARENT") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const parentId = (session.user as any).id as string;

  const children = await prisma.child.findMany({
    where: { parentId },
    select: { id: true, firstName: true, level: true, avatarUrl: true, pinHash: true },
    orderBy: { createdAt: "asc" },
  });

  // Ne jamais exposer pinHash tel quel : on renvoie juste un booléen.
  const safe = children.map((c) => ({
    id: c.id,
    firstName: c.firstName,
    level: c.level,
    avatarUrl: c.avatarUrl,
    hasPin: !!c.pinHash,
  }));

  return NextResponse.json(safe);
}
