// Les gestes du joueur sur la carte du Monde (US-0420), traduits en demandes à la carte : la déplacer de tant de
// pixels. Ils ne savent rien de la vue elle-même (vue.ts) ; ils se vérifient avec des événements simulés.

/** Ce que les gestes demandent à la carte. */
export type Commandes = {
  /** US-0420 : la faire glisser de (dx, dy) pixels, ce qu'il y avait sous le pointeur restant sous lui. */
  deplacer: (dx: number, dy: number) => void;
};

/**
 * US-0420 : de combien de pixels un pointeur appuyé doit bouger avant qu'on le prenne pour un glissement : en
 * deçà, c'est un clic, même si la main tremble un peu.
 */
export const SEUIL_DE_GLISSEMENT = 4;

/**
 * US-0420 : suit les gestes du joueur sur la carte (`element`) et les transmet à `commandes`, jusqu'à l'appel de
 * la fonction rendue. Glisser en gardant le bouton principal appuyé déplace la carte, d'autant que la souris
 * depuis l'endroit où il a été appuyé, une fois passé le seuil de glissement ; la carte garde la souris quand
 * elle sort de l'écran en chemin.
 */
export function suivreLesGestes(element: HTMLElement, commandes: Commandes): () => void {
  // Le pointeur appuyé sur la carte : là où il a été appuyé, sa dernière position prise en compte, et s'il glisse.
  let appuye: { id: number; depart: { x: number; y: number }; dernier: { x: number; y: number }; glisse: boolean } | null = null;

  const poser = (e: PointerEvent) => {
    if (appuye || e.button !== 0) return;
    element.setPointerCapture(e.pointerId);
    const ici = { x: e.clientX, y: e.clientY };
    appuye = { id: e.pointerId, depart: ici, dernier: ici, glisse: false };
  };
  const bouger = (e: PointerEvent) => {
    if (appuye?.id !== e.pointerId) return;
    const ici = { x: e.clientX, y: e.clientY };
    if (!appuye.glisse && Math.hypot(ici.x - appuye.depart.x, ici.y - appuye.depart.y) < SEUIL_DE_GLISSEMENT) return;
    appuye.glisse = true;
    commandes.deplacer(ici.x - appuye.dernier.x, ici.y - appuye.dernier.y);
    appuye.dernier = ici;
  };
  const lever = (e: PointerEvent) => {
    if (appuye?.id === e.pointerId) appuye = null;
  };

  const ecoutes = [
    ["pointerdown", poser],
    ["pointermove", bouger],
    ["pointerup", lever],
    ["pointercancel", lever],
  ] as const;
  for (const [type, rappel] of ecoutes) element.addEventListener(type, rappel);
  return () => {
    for (const [type, rappel] of ecoutes) element.removeEventListener(type, rappel);
  };
}
