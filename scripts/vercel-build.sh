#!/bin/sh
# Construction sur Vercel. D'abord les vérifications (lint, types, garde-fou des migrations,
# tests) : un échec arrête tout, rien n'est migré ni mis en ligne. Puis les migrations en
# attente passent avant la nouvelle version ; si elles échouent, l'ancienne reste en ligne.
# En production, elles s'appliquent à la base de production ; en prévisualisation, à la
# branche Neon propre à la branche Git, et le script refuse la base de production.
# Le scan de secrets, qui a besoin de l'historique Git, tourne sur GitHub.
set -e
npm run check:code
if [ "$VERCEL_ENV" = "production" ] || [ "$VERCEL_ENV" = "preview" ]; then
  npm run db:migrate
fi
npm run build
