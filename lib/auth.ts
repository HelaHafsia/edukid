import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

// ----------------------------------------------------------------------------
// EduKid — Authentification NextAuth
// Seuls Admin et Parent se connectent via email/mot de passe.
// L'Enfant est sélectionné DEPUIS l'espace Parent (pas de login NextAuth pour
// lui) : voir /lib/child-session.ts pour la mini-session enfant (cookie signé
// + PIN optionnel), volontairement séparée de la session NextAuth.
// ----------------------------------------------------------------------------

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/connexion",
    error: "/connexion",
  },
  providers: [
    CredentialsProvider({
      name: "Email et mot de passe",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email et mot de passe requis.");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user) {
          throw new Error("Identifiants invalides.");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) {
          throw new Error("Identifiants invalides.");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
};

// ----------------------------------------------------------------------------
// Helpers de garde de rôle, à utiliser dans chaque route/API Admin ou Parent.
// ----------------------------------------------------------------------------

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/connexion");
  }
  return session;
}

export async function requireParent() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "PARENT") {
    redirect("/connexion");
  }
  return session;
}

// Vérifie que l'enfant demandé appartient bien au parent connecté.
// À appeler dans CHAQUE route qui reçoit un childId, avant toute lecture/écriture.
export async function requireOwnChild(childId: string) {
  const session = await requireParent();
  const parentId = (session.user as any).id as string;

  const child = await prisma.child.findFirst({
    where: { id: childId, parentId },
  });

  if (!child) {
    throw new Error("Accès refusé : cet enfant n'appartient pas à ce parent.");
  }

  return { session, child };
}

// Variante pour les routes API (Route Handlers) : ne redirige jamais (ça
// casserait une réponse JSON), renvoie null si non autorisé à la place.
export async function requireOwnChildApi(childId: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "PARENT") return null;

  const parentId = (session.user as any).id as string;
  const child = await prisma.child.findFirst({
    where: { id: childId, parentId },
  });

  if (!child) return null;
  return { session, child };
}
