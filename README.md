# Bestia 2

Bestia repensé de zéro. On garde la direction artistique et l'univers validés dans le premier prototype ([Zewed/bestia](https://github.com/Zewed/bestia)) : une planète sauvage découpée en territoires, des animaux dressés à la place des vaisseaux, des illustrations peintes entre Clash Royale et Hearthstone, une interface Bento. Tout le reste, et d'abord les mécaniques de jeu, est remis en question.

- `CONTEXT.md` : le vocabulaire du jeu, écrit au fil de la conception.
- `docs/adr/` : les décisions structurantes et leurs raisons.
- `docs/ordre-d-attaque.md` : l'ordre dans lequel on construit le jeu, étape par étape.
- `docs/stories/` : les 752 user stories qui découpent chaque étape, avec leurs déblocages et les points encore à décider.

## Lancer le jeu

Il faut Node 22 ou plus récent.

```bash
npm install
npm run dev
```

Le jeu répond sur http://localhost:3000. La base est chez Neon, rattachée au projet Vercel `bestia-2`. La production utilise `neondb` ; le poste local utilise `bestia_dev`, une base à part dans le même projet. Pour tout installer sur un nouveau poste : `vercel env pull .env.local` récupère l'adresse de production, puis `npm run db:dev-setup` crée la base de développement et écrit `.env.development.local`, qui passe avant `.env.local`. Aucune de ces adresses ne va dans le dépôt. `npm run db:check` dit quelle base est utilisée et vérifie que le jeu y lit et écrit. Les variables nécessaires sont listées, sans valeur, dans `.env.example` ; le serveur refuse de démarrer s'il en manque une. `npm run test` lance les tests automatiques (Vitest). Avant chaque envoi, `npm run check` passe le lint, les types, le garde-fou des migrations, les tests et le scan de secrets. GitHub refait ces vérifications à chaque envoi et affiche le résultat à côté du commit ; la construction Vercel les refait aussi, et un échec bloque la mise en ligne.

## Faire évoluer la base

La structure de la base est décrite dans `src/db/schema.ts`. Chaque changement passe par une migration versionnée dans `drizzle/` :

```bash
npm run db:generate
npm run db:migrate
```

La première commande écrit la migration à partir du schéma. La seconde applique, dans l'ordre, celles qui manquent ; relancée sur une base à jour, elle ne change rien. Une migration qui viderait ou supprimerait des données (TRUNCATE, DELETE, DROP TABLE, DROP COLUMN…) est refusée, à l'application comme par `npm run check` : un Monde ne se réinitialise jamais.

## Mettre en ligne

Le jeu est en ligne sur https://bestia-2.vercel.app. Il tourne sur Vercel, à Francfort comme sa base. Chaque envoi sur `main` le remet en ligne tout seul ; si la construction échoue, la version précédente reste en ligne. Chaque autre branche obtient une prévisualisation, réservée à l'équipe Vercel, avec sa propre branche Neon : une prévisualisation ne touche jamais la base de production, et refuse de migrer ou de démarrer si elle s'y retrouve branchée. La page porte le commit dont elle vient (`<meta name="bestia-version">`), et https://bestia-2.vercel.app/sante dit si le jeu et sa base répondent (HTTP 200 « ok », ou 503 avec un code d'erreur), quelle version est en ligne et si la base est celle de production, sans jamais exposer de secret. En production, les migrations en attente passent pendant la construction, avant que la nouvelle version réponde (`scripts/vercel-build.sh`).

## Couleurs

Toutes les couleurs du jeu, reprises du prototype (thème Bento et barre Encre), sont rangées sous un nom unique dans `src/styles/palette.css`. C'est le seul endroit où une couleur s'écrit en clair : les écrans n'utilisent que ces noms (`var(--encre)`, `var(--citron)`…), et un test refuse toute couleur écrite en dur ailleurs.

## Typographie

Plus Jakarta Sans partout, comme dans le prototype : 500 pour les textes, 800 pour les titres et les nombres (`src/styles/typographie.css`). Next l'héberge avec le jeu (`src/styles/fonts.ts`) et règle la police de secours aux mêmes dimensions, pour que rien ne saute pendant le chargement. Un test vérifie que la police couvre les caractères du jeu (é, ç, œ, É…).

## Composants

- `Bloc` (`src/components/Bloc.tsx`) : la brique Bento de chaque écran. Blanc, coins de 12 px, marges de 16 × 18 px, sans bordure ni ombre, comme dans le prototype. Titre facultatif en petites capitales ; `plein` pour une illustration qui touche les bords. Les formes (arrondis, marges, écarts) sont dans `src/styles/formes.css`.
- `Grille` (`src/components/Grille.tsx`) : range les blocs comme le prototype. Douze colonnes sur ordinateur, où `<Bloc largeur={7}>` occupe 7 colonnes (toutes par défaut) ; deux au plus sur tablette (jusqu'à 1100 px) ; une seule sur mobile (jusqu'à 820 px), dans l'ordre de lecture. Aucun défilement de côté jusqu'à 320 px de large.
- `BarreHaut` (`src/components/BarreHaut.tsx`) : la barre du haut Encre, sur chaque page (posée par `src/app/layout.tsx`). Collée aux bords de la fenêtre, accrochée en haut au défilement, 64 px de haut, 48 px sur mobile (`--hauteur-barre`).
