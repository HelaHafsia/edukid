import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ----------------------------------------------------------------------------
// Crée le tout premier compte Admin, et les 4 Subject de référence
// (Français/Maths/Arabe/Anglais) nécessaires avant de créer du contenu.
//
// Usage :
//   ADMIN_EMAIL="admin@edukid.fr" ADMIN_PASSWORD="motdepasseTresLong123" \
//   npx tsx prisma/seed.ts
//
// (ou renseigner les valeurs par défaut ci-dessous puis `npx prisma db seed`
// si tu ajoutes  "prisma": { "seed": "tsx prisma/seed.ts" }  dans package.json)
// ----------------------------------------------------------------------------

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@edukid.fr";
  const password = process.env.ADMIN_PASSWORD ?? "ChangeMoiImmediatement123";

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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
