import { cookies } from "next/headers";
import crypto from "crypto";

// ----------------------------------------------------------------------------
// EduKid — Mini-session Enfant
//
// L'Enfant n'a pas de compte NextAuth : il est sélectionné DEPUIS l'espace
// Parent (après vérification que l'enfant appartient bien au parent connecté
// + PIN optionnel). On matérialise ce choix par un cookie signé contenant
// juste le childId, séparé de la session NextAuth du Parent.
// ----------------------------------------------------------------------------

const COOKIE_NAME = "edukid_child_session";
const SECRET = process.env.NEXTAUTH_SECRET ?? "dev-secret-change-me";

function sign(value: string) {
  const hmac = crypto.createHmac("sha256", SECRET).update(value).digest("hex");
  return `${value}.${hmac}`;
}

function verify(signed: string): string | null {
  const [value, hmac] = signed.split(".");
  if (!value || !hmac) return null;
  const expected = crypto.createHmac("sha256", SECRET).update(value).digest("hex");
  return hmac === expected ? value : null;
}

export function setChildSession(childId: string) {
  cookies().set(COOKIE_NAME, sign(childId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 6, // 6h, une session enfant ne doit pas durer indéfiniment
  });
}

export function getChildIdFromSession(): string | null {
  const raw = cookies().get(COOKIE_NAME)?.value;
  if (!raw) return null;
  return verify(raw);
}

export function clearChildSession() {
  cookies().delete(COOKIE_NAME);
}

// ----------------------------------------------------------------------------
// Helper serveur : récupère l'enfant courant (ou redirige vers /parent si
// aucune session enfant valide). À utiliser dans toutes les pages/routes
// de l'espace Enfant.
// ----------------------------------------------------------------------------

import { prisma } from "./prisma";
import { redirect } from "next/navigation";

export async function requireChildSession() {
  const childId = getChildIdFromSession();
  if (!childId) redirect("/parent");

  const child = await prisma.child.findUnique({ where: { id: childId! } });
  if (!child) redirect("/parent");

  return child!;
}

// Variante API-safe (ne redirige pas, renvoie null).
export async function requireChildSessionApi() {
  const childId = getChildIdFromSession();
  if (!childId) return null;
  return prisma.child.findUnique({ where: { id: childId } });
}
