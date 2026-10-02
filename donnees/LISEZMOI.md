# Données de référence

Les données fixes du jeu, une liste par fichier YAML : Biomes, Raretés, Rôles et Espèces. On les relit et on les corrige sans toucher au code ; `npm run db:donnees` les charge en base, et la mise en ligne le fait toute seule.

- Chaque entrée a un `id` stable : il ne change plus une fois choisi, même si le nom affiché change.
- Les lignes qui commencent par `#` sont des commentaires : on y note les sources des chiffres.
- Une entrée invalide arrête le chargement avec un message qui dit laquelle et pourquoi ; rien n'est écrit tant que tout n'est pas valide.
