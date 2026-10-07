# Bestia 2

Bestia repensé de zéro. On garde la direction artistique et l'univers validés dans le premier prototype ([Zewed/bestia](https://github.com/Zewed/bestia)) : une planète sauvage découpée en territoires, des animaux dressés à la place des vaisseaux, des illustrations peintes entre Clash Royale et Hearthstone, une interface Bento. Tout le reste, et d'abord les mécaniques de jeu, est remis en question.

- `CONTEXT.md` : le vocabulaire du jeu, écrit au fil de la conception.
- `docs/adr/` : les décisions structurantes et leurs raisons.
- `docs/ordre-d-attaque.md` : l'ordre dans lequel on construit le jeu, étape par étape.
- `docs/stories/` : les 753 user stories qui découpent chaque étape, avec leurs déblocages et les points encore à décider.

## Lancer le jeu

Il faut Node 22 ou plus récent.

```bash
npm install
npm run dev
```

Le jeu répond sur http://localhost:3000. La base est chez Neon, rattachée au projet Vercel `bestia-2`. La production utilise `neondb` ; le poste local utilise `bestia_dev`, une base à part dans le même projet. Pour tout installer sur un nouveau poste : `vercel env pull .env.local` récupère l'adresse de production, puis `npm run db:dev-setup` crée la base de développement et écrit `.env.development.local`, qui passe avant `.env.local`. Aucune de ces adresses ne va dans le dépôt. `npm run db:check` dit quelle base est utilisée et vérifie que le jeu y lit et écrit. Les variables nécessaires sont listées, sans valeur, dans `.env.example` ; le serveur refuse de démarrer s'il en manque une. `npm run test` lance les tests automatiques (Vitest). Les tests sur base (`*.db.test.ts`) tournent contre une base réservée, `bestia_test` (`npm run db:test-setup` la crée et écrit `.env.test.local`) ; sans elle, ils sont sautés. Sur GitHub, ils tournent contre un Postgres jetable. Avant chaque envoi, `npm run check` passe le lint, les types, le garde-fou des migrations, les tests et le scan de secrets. GitHub refait ces vérifications à chaque envoi et affiche le résultat à côté du commit ; la construction Vercel les refait aussi, et un échec bloque la mise en ligne.

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

- `Bloc` (`src/components/Bloc.tsx`) : la brique Bento de chaque écran. Blanc, coins de 12 px, marges de 16 × 18 px, sans bordure ni ombre, comme dans le prototype. Titre facultatif en petites capitales ; `plein` pour une illustration qui touche les bords. `teinte` pour un fond pastel (menthe, sable, lilas, ciel, rose, sarcelle, pêche, citron, titre dans le ton foncé) ou Encre (titre citron). Les formes (arrondis, marges, écarts) sont dans `src/styles/formes.css`.
- `Grille` (`src/components/Grille.tsx`) : range les blocs comme le prototype. Douze colonnes sur ordinateur, où `<Bloc largeur={7}>` occupe 7 colonnes (toutes par défaut) ; deux au plus sur tablette (jusqu'à 1100 px) ; une seule sur mobile (jusqu'à 820 px), dans l'ordre de lecture. Aucun défilement de côté jusqu'à 320 px de large.
- `BarreHaut` (`src/components/BarreHaut.tsx`) : la barre du haut Encre, sur chaque page (posée par `src/app/layout.tsx`). À droite, ce que la page y met par l'emplacement `src/app/@actions` : rien hors du jeu, le nom de chef et son menu dans le jeu, « Se déconnecter » seul tant que le joueur n'a pas de nom. Collée aux bords de la fenêtre, accrochée en haut au défilement, 64 px de haut, 48 px sur mobile (`--hauteur-barre`).
- `Logo` (`src/components/Logo.tsx`) : la tête de loup citron et « BESTIA » en capitales espacées, en vecteur, à gauche de la barre du haut ; il ramène à l'accueil.

## Textes à l'écran

Une page ne dit que ce que ses titres, champs et boutons ne disent pas déjà. Pas de phrase d'explication, d'introduction ni de rappel quand l'écran est clair sans elle : un titre, les champs, le bouton, et c'est tout. Un texte n'apparaît que s'il apporte quelque chose qu'on ne devinerait pas (une erreur, une règle à connaître avant de se tromper). Ne jamais surcharger une page ; dans le doute, on enlève.

## Icônes

L'icône d'onglet (`src/app/icon.svg`), l'icône d'écran d'accueil (`src/app/apple-icon.png`, `public/icone-*.png`) et les couleurs du manifeste sont fabriquées depuis la palette par `npm run icones`. Ces fichiers ne lisent pas les variables CSS : un test vérifie qu'ils suivent la palette, et demande de relancer `npm run icones` si l'Encre ou le citron changent. Le titre d'onglet est « Bestia », que chaque page peut compléter (« Bestia · Accueil »).

## Illustrations

Toutes les illustrations sont rangées dans le projet, sous `public/illustrations` ; celles de la vitrine dans `public/illustrations/accueil` (générées dans le style du loup et du mammouth), celle du Foyer dans `public/illustrations/foyer` (générée avec le loup, le mammouth, les castors et la hutte de connexion en références de style), les icônes des huit Métiers dans `public/illustrations/metiers`, nommées d'après leur identifiant, l'icône des Habitants dans `public/illustrations/icones` (peinte avec les icônes des Ressources en références de style), les icônes des Ressources dans `public/illustrations/ressources`, nommées d'après leur identifiant (le Bois et la Pierre repris du prototype, la Viande et les Végétaux peints avec eux en références de style), celles du prototype dans `public/illustrations/prototype`, sous leurs noms d'origine, en attendant d'être renommées par les stories qui s'en servent. Le composant `Illustration` (`src/components/Illustration.tsx`) les fait passer par l'optimiseur de Next : AVIF ou WebP, à la largeur de l'écran (`sizes`), chargées au défilement sauf l'illustration principale (`prioritaire`). Si l'une manque, la tête de loup la remplace, jamais une image cassée.

## Le Monde

Le Monde est un disque d'hexagones autour du Cœur sauvage, repérés par deux coordonnées (`src/monde/hex.ts`). Ses 6 anneaux extérieurs forment la Couronne, où naissent les joueurs, en prairie, à 4 Cases au moins les uns des autres et près des derniers arrivés (`src/monde/foyers.ts`) ; un chef reçoit sa Case, qui devient le Foyer imprenable de son Territoire, dans le même enregistrement que son nom (`src/chefs/chef.ts`). La Couronne elle-même : `npm run monde:couronne` crée ses Cases en base, avec leur Biome, en régions tirées de la graine du Monde (`src/monde/couronne.ts`) ; la mise en ligne le lance toute seule, après les données de référence. Il ne fait qu'ajouter les Cases qui manquent : une Case déjà en base ne change jamais. La taille du Monde et les parts de chaque Biome sont dans `src/reglages.ts`. Le rayon est fixé sur le Monde dès que sa Couronne est préparée ; la Couronne peut ensuite s'élargir vers l'intérieur, jamais rétrécir, et comme les Biomes sont calculés sur une bande fixe de 10 anneaux, l'élargir ne change aucune Case. La page de contrôle montre la Couronne vue d'en haut, avec les emplacements de Foyer encore libres.

## Le temps du jeu

Hors production (en local et sur les prévisualisations ; la production l'ignore et le signale dans le journal au démarrage), `BESTIA_VITESSE_TEMPS=100` fait passer le temps du jeu cent fois plus vite (une minute réelle, cent minutes de jeu) ; la vitesse et son ancre sont gardées dans la table `horloge` et chargées au démarrage du serveur, si bien que changer de vitesse ne fait jamais reculer l'heure du jeu. L'heure du jeu vient du serveur et d'une seule fonction, `maintenant()` (`src/temps/horloge.ts`) : une règle de lint interdit toute autre lecture de l'horloge, et les modules de calcul sont marqués `server-only`, si bien que l'horloge d'un téléphone ne compte jamais. Les instants sont enregistrés en temps universel et affichés dans le fuseau du joueur (`formaterInstant`). Le jeu calcule le temps après coup : chaque élément qui vit dans le temps (le Monde, et chaque Territoire depuis sa naissance) garde un marque-page « calculé jusqu'à ». `avancerMarquePage` (`src/temps/marque-page.ts`) verrouille l'élément, calcule l'intervalle et déplace le marque-page dans une seule transaction : un calcul raté n'enregistre rien, deux rattrapages simultanés ne comptent jamais deux fois le même temps, et la base refuse qu'un marque-page recule. Au-dessus, `avancer` (`src/temps/avancer.ts`) est le mécanisme unique : il découpe le temps aux instants exacts des événements datés (table `evenement`, `programmerEvenement`), fait évoluer l'élément jusqu'au premier, applique l'événement, et ainsi de suite jusqu'à maintenant. Avancer de dix heures d'un coup donne le même résultat qu'avancer dix fois d'une heure. `rattraper` (`src/temps/rattraper.ts`) s'appelle en haut de toute page ou action qui montre ou touche un élément : il l'avance jusqu'à maintenant avec ses règles (`src/temps/regles.ts`), puis le lit ; en cas d'échec, la page d'erreur le dit (`src/app/error.tsx`) plutôt que d'afficher un état périmé. Toute lecture d'un Territoire, par n'importe quel joueur, passera par là. La page de santé rattrape déjà le Monde Aube à chaque visite. Une tâche planifiée Vercel (`vercel.json`, `/taches/temps`) passe toutes les 5 minutes et rattrape, par lots et dans un budget de temps, tout élément qui n'a pas été calculé depuis plus de 5 minutes (`src/temps/absents.ts`). Seule la tâche de Vercel peut l'appeler : elle envoie le secret `CRON_SECRET` (variable d'environnement, générée et rangée sans être affichée) ; tout autre appel est refusé (401) et noté dans le journal. Chaque passage est noté dans la table `passage_tache` (heure, durée, éléments avancés, erreurs), gardé 7 jours ; la page de santé donne le dernier passage et signale une tâche en retard (aucun passage depuis 15 minutes). Les chiffres réglables sont rassemblés dans `src/reglages.ts`.

## Données de référence

Les données fixes du jeu (Biomes, Raretés, Rôles, Espèces, Ressources) vivent dans `donnees/`, un fichier YAML par liste, lisible et corrigeable sans toucher au code (voir `donnees/LISEZMOI.md`). `npm run db:donnees` les valide toutes, puis les écrit en base dans une seule transaction : il ajoute les nouvelles entrées, met à jour celles qui ont changé et ne crée jamais de doublon. La mise en ligne le lance toute seule, après les migrations. Une Espèce ne donne que ses mesures réelles (masse, arme, venin, vitesse, Nourriture par jour) : le barème (`src/donnees/bareme.ts`, `docs/adr/0007`) en tire l'attaque, la vie, les Places, la charge et l'Entretien, si bien qu'un réglage du barème rééquilibre toutes les Espèces d'un coup.

Les mots interdits dans un nom de chef (US-0138) font exception : ils vivent seulement en base, dans la table `mot_interdit`, pour changer sans nouvelle version du jeu. La liste de départ vient de la migration `0021`. Un mot s'écrit sous sa forme de comparaison (minuscules, sans accents, espaces ni signes) ; `entier` vaut `true` pour un mot court qui ne doit être refusé que seul (« con » refuse « Le Con », pas « Faucon »). Ajouter un mot : `insert into mot_interdit (mot, entier) values ('exemple', false);` sur la base de production ; le jeu lit la liste à chaque vérification.
