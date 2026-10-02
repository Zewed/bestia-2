#!/bin/sh
# Attend que le commit donné soit en ligne : npm run attendre-en-ligne [-- <commit>]
# Réussit seulement quand /sante sert ce commit ; échoue si la construction Vercel échoue.
set -u
COMMIT="${1:-$(git rev-parse --short HEAD)}"
SITE="https://bestia-2.vercel.app"
i=0
while [ $i -lt 60 ]; do
  if curl -s "$SITE/sante" | grep -q "\"version\":\"$COMMIT\""; then
    echo "En ligne : $COMMIT sur $SITE."
    exit 0
  fi
  ETAT=$(vercel ls bestia-2 2>/dev/null | grep -E "Production" | head -1)
  if echo "$ETAT" | grep -q "Error"; then
    echo "ÉCHEC : la dernière mise en ligne de production a échoué ($COMMIT n'est pas en ligne)."
    echo "$ETAT" | awk '{print "  " $3}'
    exit 1
  fi
  sleep 10
  i=$((i + 1))
done
echo "ÉCHEC : $COMMIT n'est toujours pas en ligne après 10 minutes."
exit 1
