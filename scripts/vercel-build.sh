#!/bin/sh
# Construction sur Vercel. En production, les migrations en attente passent avant la
# nouvelle version : si elles échouent, la construction échoue et l'ancienne version reste en ligne.
# Les prévisualisations ne touchent jamais la base de production.
set -e
if [ "$VERCEL_ENV" = "production" ]; then
  npm run db:migrate
fi
npm run build
