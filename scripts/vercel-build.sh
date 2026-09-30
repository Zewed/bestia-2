#!/bin/sh
# Construction sur Vercel. Les migrations en attente passent avant la nouvelle version :
# si elles échouent, la construction échoue et l'ancienne version reste en ligne.
# En production, elles s'appliquent à la base de production ; en prévisualisation, à la
# branche Neon propre à la branche Git, et le script refuse la base de production.
set -e
if [ "$VERCEL_ENV" = "production" ] || [ "$VERCEL_ENV" = "preview" ]; then
  npm run db:migrate
fi
npm run build
