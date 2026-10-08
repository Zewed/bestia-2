// Le retour de la carte sur le Foyer (US-0426), en mouvement : une vue par image de l'écran, calculée par vue.ts.
import { CARTE_RETOUR_AU_FOYER_MS } from "@/reglages";
import type { Vue } from "./dessin";
import { enChemin } from "./vue";

/**
 * US-0426 : fait glisser la carte de `depart` à `arrivee` en CARTE_RETOUR_AU_FOYER_MS, en donnant à `montrer` une
 * vue à chaque image de l'écran, à compter de la première ; d'un coup, sans mouvement, si le joueur préfère les
 * écrans sans mouvement. Rend de quoi l'arrêter là où il en est.
 */
export function glisser(depart: Vue, arrivee: Vue, montrer: (vue: Vue) => void): () => void {
  if (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches) {
    montrer(arrivee);
    return () => {};
  }
  let debut: number | null = null;
  const pas = (maintenant: number) => {
    debut ??= maintenant;
    const t = Math.min(1, (maintenant - debut) / CARTE_RETOUR_AU_FOYER_MS);
    if (t < 1) image = requestAnimationFrame(pas);
    montrer(enChemin(depart, arrivee, t));
  };
  let image = requestAnimationFrame(pas);
  return () => cancelAnimationFrame(image);
}
