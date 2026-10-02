// Avant chaque fichier de test : aucun test ne dépend de l'environnement où il tourne.
// Sur Vercel, la construction tourne avec VERCEL_ENV=production ; les tests qui ont besoin
// d'un environnement précis le fixent eux-mêmes.
delete process.env.VERCEL_ENV;
