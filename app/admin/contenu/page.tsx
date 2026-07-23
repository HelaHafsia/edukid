export default function ContenuPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900 mb-2">
        Contenu pédagogique
      </h1>
      <p className="text-sm text-slate-500 max-w-md">
        Gestion des cours, exercices, quiz et évaluations — à construire à
        l&apos;étape suivante. Les routes API (
        <code>/api/admin/courses</code>, <code>/api/admin/quizzes</code>,{" "}
        <code>/api/admin/evaluations</code>) sont déjà prêtes et
        fonctionnelles.
      </p>
    </div>
  );
}
