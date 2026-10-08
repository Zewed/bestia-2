# Conventions des workers de Bestia 2

Lis d'abord `AGENTS.md` (ce Next.js 16 a des changements cassants ; les guides sont dans `node_modules/next/dist/docs/`) et `CONTEXT.md` (les mots du jeu, avec leur majuscule : Territoire, Foyer, Case, Habitant, Bête, Expédition…).

## Le ticket
- La story de `docs/stories` citée dans le ticket fait foi ; les décisions du ticket (« décidé le … ») et ses valeurs provisoires sont tranchées : ne les rediscute pas, ne tranche aucune autre question de jeu (demande avec `armada ask`).
- **Ne touche pas à `docs/`** : le coordinateur y écrit le statut de la story et les décisions à la fusion.
- Une valeur « à régler en jouant » va dans `src/reglages.ts`, **ajoutée à la fin** du fichier, commentée avec sa story et « valeur provisoire ».
- Une migration Drizzle : réserve son numéro (`armada reserve migration --next`), puis `drizzle/00NN_*.sql`, son entrée de journal et `src/db/schema.ts`. Jamais de migration destructrice.

## Le code
- Français partout : noms, commentaires, textes. Commentaires qui citent la story (`US-0901 : …`), avec la même densité et les mêmes idiomes que le code autour.
- Pages sobres : aucune phrase d'explication quand les titres, champs et boutons suffisent ; la seule phrase admise est celle que la story demande.
- Aucune bibliothèque nouvelle sans le demander.
- Test d'abord, un critère à la fois, à l'interface où le joueur l'observe.

## Avant chaque envoi
- `npm run lint`, `npm run typecheck`, puis la suite : `NODE_ENV=production VERCEL_ENV=production npx vitest run --maxWorkers=2`. Sans Postgres local, les tests sur base sont sautés : la CI les passe sur ta branche, attends-la verte.
- Tests sur base connus pour échouer parfois sous charge : la naissance dans `chef.db.test.ts` et `habitants.db.test.ts`, le seuil de vitesse de `longue-absence.db.test.ts` et `synchroniser-horloge.db.test.ts`. Relance-les seuls et dis-le dans ton rapport.
- Un critère visible se vérifie en vrai, dans un navigateur, de 320 à 1 440 px, sans défilement de côté ; joins une capture avec `armada attach`.

## La pull request
- Titre : exactement celui du ticket (`US-0901 · Ouvrir l'écran d'Expédition`), un commit par story ; corps : ce que le joueur vit désormais, comment chaque critère a été vérifié, ce qui reste hors du ticket.
- Fin de chaque message de commit : `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
