// Les gestes du joueur sur la carte du Monde (US-0420), traduits en demandes à la carte : la déplacer de tant de
// pixels, ou d'un pas au clavier. Ils ne savent rien de la vue elle-même (vue.ts) ; ils se vérifient avec des
// événements simulés.

/** Ce que les gestes demandent à la carte. */
export type Commandes = {
  /** US-0420 : la faire glisser de (dx, dy) pixels, ce qu'il y avait sous le pointeur restant sous lui. */
  deplacer: (dx: number, dy: number) => void;
  /** US-0422 : la faire avancer d'un pas, en colonnes vers l'est (1) ou l'ouest (-1), en rangées vers le sud (1) ou le nord (-1). */
  avancer: (colonnes: number, rangees: number) => void;
};

/** US-0422 : où chaque flèche du clavier fait regarder la carte, en colonnes et en rangées. */
const FLECHES: Record<string, [number, number]> = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] };

/**
 * US-0420 : de combien de pixels un pointeur appuyé doit bouger avant qu'on le prenne pour un glissement : en
 * deçà, c'est un clic, même si la main tremble un peu. US-0421 : un doigt bouge davantage en se posant qu'une
 * souris (ou un stylet) : un toucher bref ne déplace rien.
 */
export const SEUIL_DE_GLISSEMENT = { souris: 4, doigt: 8 };

/**
 * US-0420 : suit les gestes du joueur sur la carte (`element`) et les transmet à `commandes`, jusqu'à l'appel de
 * la fonction rendue. Glisser en gardant le bouton principal appuyé déplace la carte, d'autant que la souris
 * depuis l'endroit où il a été appuyé, une fois passé le seuil de glissement ; la carte garde la souris quand
 * elle sort de l'écran en chemin. US-0421 : de même au doigt, ces mêmes événements du navigateur valant pour la
 * souris, le doigt et le stylet. US-0422 : la carte sélectionnée, chaque flèche du clavier la fait avancer d'un
 * pas ; avec Alt, Ctrl ou Cmd, la flèche reste au navigateur (revenir à la page d'avant…).
 */
export function suivreLesGestes(element: HTMLElement, commandes: Commandes): () => void {
  // Le pointeur appuyé sur la carte : là où il a été appuyé, sa dernière position prise en compte, son seuil de
  // glissement, et s'il glisse.
  let appuye: { id: number; depart: { x: number; y: number }; dernier: { x: number; y: number }; seuil: number; glisse: boolean } | null = null;

  const poser = (e: PointerEvent) => {
    if (appuye || e.button !== 0) return;
    element.setPointerCapture(e.pointerId);
    const ici = { x: e.clientX, y: e.clientY };
    const seuil = e.pointerType === "touch" ? SEUIL_DE_GLISSEMENT.doigt : SEUIL_DE_GLISSEMENT.souris;
    appuye = { id: e.pointerId, depart: ici, dernier: ici, seuil, glisse: false };
  };
  const bouger = (e: PointerEvent) => {
    if (appuye?.id !== e.pointerId) return;
    const ici = { x: e.clientX, y: e.clientY };
    if (!appuye.glisse && Math.hypot(ici.x - appuye.depart.x, ici.y - appuye.depart.y) < appuye.seuil) return;
    appuye.glisse = true;
    commandes.deplacer(ici.x - appuye.dernier.x, ici.y - appuye.dernier.y);
    appuye.dernier = ici;
  };
  const lever = (e: PointerEvent) => {
    if (appuye?.id === e.pointerId) appuye = null;
  };
  // US-0422 : une flèche fait avancer la carte d'un pas ; la page, elle, ne défile pas.
  const appuyer = (e: KeyboardEvent) => {
    const sens = FLECHES[e.key];
    if (!sens || e.altKey || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    commandes.avancer(...sens);
  };

  const ecoutes: [string, (e: never) => void][] = [
    ["pointerdown", poser],
    ["pointermove", bouger],
    ["pointerup", lever],
    ["pointercancel", lever],
    ["keydown", appuyer],
  ];
  for (const [type, rappel] of ecoutes) element.addEventListener(type, rappel as EventListener);
  return () => {
    for (const [type, rappel] of ecoutes) element.removeEventListener(type, rappel as EventListener);
  };
}
