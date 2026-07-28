import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ----------------------------------------------------------------------------
// Crée le tout premier compte Admin, et les 4 Subject de référence
// (Français/Maths/Arabe/Anglais) nécessaires avant de créer du contenu.
// Crée aussi les badges par défaut s'ils n'existent pas encore.
//
// Usage (ADMIN_EMAIL et ADMIN_PASSWORD sont OBLIGATOIRES, pas de valeur
// par défaut, pour ne jamais laisser un mot de passe connu dans le code) :
//   $env:ADMIN_EMAIL="admin@edukid.fr"; $env:ADMIN_PASSWORD="motdepasseTresLong123"; `
//   npx tsx prisma/seed.ts
//
// Rejouable sans risque : si le compte existe déjà, il n'est pas dupliqué
// (upsert), seuls les matières/badges manquants sont ajoutés.
// ----------------------------------------------------------------------------

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  // Sécurité : plus jamais de mot de passe par défaut visible dans le code
  // (risque si le dépôt est public). Le script refuse de s'exécuter sans
  // ces deux variables explicitement fournies.
  if (!email || !password) {
    console.error(
      "ADMIN_EMAIL et ADMIN_PASSWORD doivent être fournis explicitement, ex :\n" +
        '  $env:ADMIN_EMAIL="toi@exemple.com"; $env:ADMIN_PASSWORD="UnMotDePasseSolide123"; npx tsx prisma/seed.ts'
    );
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("ADMIN_PASSWORD doit contenir au moins 8 caractères.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      name: "Administrateur EduKid",
      role: "ADMIN",
    },
  });
  console.log(`Compte Admin prêt : ${admin.email} (mot de passe : ${password})`);

  const subjects = [
    { code: "FRANCAIS", name: "Français" },
    { code: "MATHS", name: "Mathématiques" },
    { code: "ARABE", name: "Arabe" },
    { code: "ANGLAIS", name: "Anglais" },
  ] as const;

  for (const s of subjects) {
    await prisma.subject.upsert({
      where: { code: s.code },
      update: {},
      create: s,
    });
  }
  console.log("Matières de référence créées : Français, Maths, Arabe, Anglais.");

  const badges = [
    { code: "FIRST_COURSE", label: "Premier pas", description: "A terminé son premier cours." },
    { code: "QUIZ_MASTER_80", label: "As du quiz", description: "A réussi 5 quiz avec plus de 80% de bonnes réponses." },
    { code: "STREAK_7", label: "Régulier", description: "S'est entraîné pendant 7 jours différents." },
    { code: "FIRST_EVALUATION", label: "Première évaluation", description: "A terminé sa première évaluation." },
  ];

  for (const b of badges) {
    await prisma.badge.upsert({ where: { code: b.code }, update: {}, create: b });
  }
  console.log("Badges par défaut créés.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });