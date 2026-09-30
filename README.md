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

Le jeu répond sur http://localhost:3000. La base est chez Neon, rattachée au projet Vercel `bestia-2` : `vercel env pull .env.local` récupère son adresse, qui ne va jamais dans le dépôt, et `npm run db:check` vérifie que le jeu y lit et écrit. Avant chaque envoi, `npm run check` passe le lint et la vérification des types.
