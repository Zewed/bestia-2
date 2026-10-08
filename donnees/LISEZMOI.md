# Données de référence

Les données fixes du jeu, une liste par fichier YAML : Biomes, Raretés, Rôles, Espèces, Ressources, prénoms et Métiers des Habitants. On les relit et on les corrige sans toucher au code ; `npm run db:donnees` les charge en base, et la mise en ligne le fait toute seule.

- Chaque entrée a un `id` stable : il ne change plus une fois choisi, même si le nom affiché change.
- Les lignes qui commencent par `#` sont des commentaires : on y note les sources des chiffres.
- Une entrée invalide arrête le chargement avec un message qui dit laquelle et pourquoi ; rien n'est écrit tant que tout n'est pas valide.
- `especes-essai.yaml` : des Espèces d'essai, provisoires, pour essayer les Bêtes sauvages avant la liste validée des Espèces. Elles ne se chargent qu'en développement et dans les tests, jamais en ligne ; pour les retirer, on supprime le fichier, rien d'autre.
- `raretes-par-anneau.yaml` : les chances de chaque Rareté pour une Bête sauvage qui apparaît, Anneau par Anneau, de la Couronne au Cœur sauvage, en pourcentages (100 par ligne). Elle ne va pas en base : le jeu la lit telle quelle.
