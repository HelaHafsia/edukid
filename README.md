# EduKid — Base du projet (Étape 1/4 : Schéma + Auth)

## Ce qui est livré ici

1. **`prisma/schema.prisma`** — schéma complet :
   - `User` (ADMIN/PARENT), `Child` (niveau CP→CM2, PIN optionnel)
   - `Subject` (Français/Maths/Arabe/Anglais — tous prévus dès le départ)
   - `Course` + `Exercise` (Apprentissage : correction complète autorisée)
   - `Quiz` + `QuizQuestion` (jamais de correction, hint seulement)
   - `Evaluation` + `EvaluationQuestion` (idem + `skillTag` pour le bilan)
   - `Result` (bilan par matière/rubrique), `Badge` / `ChildBadge`
   - `ReferenceBook`, `HomeworkRequest` (devoirs assistés)

2. **`lib/auth.ts`** — NextAuth (Credentials, email + mot de passe) pour
   Admin/Parent uniquement. Contient aussi `requireAdmin()`,
   `requireParent()`, et `requireOwnChild(childId)` — à utiliser dans
   **chaque** route qui touche à un enfant, pour vérifier l'appartenance
   au parent connecté.

3. **`lib/assessment-service.ts`** — pièce centrale qui **applique la règle
   métier critique** : la correction complète n'est possible que côté
   Apprentissage (`gradePracticeExercise`). `gradeQuizQuestion` et
   `gradeEvaluationQuestion` ne renvoient jamais `answer`, uniquement
   `hint` (+ `skillTag` pour l'évaluation). Toutes les routes API doivent
   passer par ces fonctions plutôt que de lire `answer` directement.

4. **`lib/prisma.ts`** — client Prisma singleton.

5. **`app/api/auth/[...nextauth]/route.ts`** — endpoint NextAuth (App Router).

## Prochaines étapes (dans l'ordre demandé)

- **Espace Admin** : CRUD Parents, CRUD Enfants, CRUD contenu pédagogique
  (cours/exercices/quiz/évaluations), gestion des manuels de référence.
  Toutes les routes protégées par `requireAdmin()`.
- **Espace Parent** : liste enfants, ajout d'enfant (avec PIN optionnel),
  bilan par enfant (3 rubriques + axes d'amélioration calculés à partir des
  `skillTag` ratés + badges). Routes protégées par `requireParent()` +
  `requireOwnChild()`.
- **Espace Enfant** : sélection de profil (depuis l'espace parent),
  Apprentissage (cours lu à voix haute via Web Speech API + pratique avec
  correction), Quiz (hint seulement), Évaluation (idem + calcul skillTag),
  Devoirs assistés (détection matière/niveau + génération d'exercices à
  partir des manuels de référence).
- **Badges** : moteur de règles simple (premier cours terminé, 5 quiz
  >80%, régularité 7 jours) déclenché après chaque `Result` créé.

## Installer et lancer localement

```bash
npm install
npx prisma migrate dev --name init
npm run dev
```

Variables d'environnement nécessaires (`.env`) :
```
DATABASE_URL="postgresql://user:password@localhost:5432/edukid"
NEXTAUTH_SECRET="générer avec: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

Dis-moi si tu veux que j'enchaîne maintenant sur **l'espace Admin**
(CRUD comptes parents + enfants + contenu pédagogique), en respectant la
même règle correction/indication.
