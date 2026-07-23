# Déployer EduKid en ligne (lien public) — Vercel + Neon

Objectif : obtenir un vrai lien du type `https://edukid-xxx.vercel.app`.
Tout se fait dans TON navigateur, avec tes propres comptes — je ne peux pas
créer de comptes ou entrer d'identifiants à ta place.

## 1. Créer la base de données (Neon, gratuit)

1. Va sur https://neon.tech et crée un compte (ou connecte-toi avec GitHub).
2. "Create a project" → nomme-le `edukid`.
3. Une fois créé, va dans l'onglet **Connection string** → copie l'URL
   "Pooled connection" (elle commence par `postgresql://...`).
4. Colle-la dans `.env.example` renommé en `.env`, à la place de
   `DATABASE_URL`.

## 2. Mettre le code sur GitHub

1. Crée un dépôt vide sur https://github.com/new (ex. `edukid`).
2. En local, dans le dossier du projet :
   ```bash
   git init
   git add .
   git commit -m "EduKid: schema, auth, espace admin"
   git branch -M main
   git remote add origin https://github.com/TON_USER/edukid.git
   git push -u origin main
   ```

## 3. Déployer sur Vercel

1. Va sur https://vercel.com et connecte-toi avec ton compte GitHub.
2. "Add New" → "Project" → sélectionne le dépôt `edukid`.
3. Vercel détecte Next.js automatiquement, rien à changer dans les
   réglages de build.
4. Dans **Environment Variables**, ajoute :
   - `DATABASE_URL` → l'URL Neon copiée à l'étape 1
   - `NEXTAUTH_SECRET` → génère-en une avec `openssl rand -base64 32`
     (ou https://generate-secret.vercel.app/32)
   - `NEXTAUTH_URL` → laisse vide pour l'instant, tu la mettras à jour
     après le premier déploiement avec l'URL réelle (ex.
     `https://edukid-xxx.vercel.app`)
5. Clique **Deploy**.

## 4. Appliquer les migrations Prisma sur la base Neon

Depuis ta machine, une seule fois (ou à chaque évolution du schéma) :
```bash
npx prisma migrate deploy
```
(avec `DATABASE_URL` de Neon dans ton `.env` local)

## 5. Créer le premier compte Admin

Le schéma n'a pas de "seed" par défaut : il faut créer le tout premier
Admin manuellement (aucune route publique de création d'Admin, par
sécurité). Le plus simple :
```bash
npx prisma studio
```
→ ouvre une interface locale sur `http://localhost:5555`, table `User`,
et crée une ligne avec `role = ADMIN` et un `passwordHash` généré via un
petit script (je peux te fournir un script `seed.ts` si tu veux).

## 6. C'est en ligne

Retourne dans les réglages Vercel → mets à jour `NEXTAUTH_URL` avec
l'URL réelle du déploiement, puis "Redeploy". Ton lien public est prêt.

---

Dis-moi si tu veux que je te génère directement le script `prisma/seed.ts`
pour créer le compte Admin automatiquement au lieu de le faire à la main.
