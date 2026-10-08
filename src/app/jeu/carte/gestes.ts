// Les gestes du joueur sur la carte du Monde (US-0420), traduits en demandes à la carte : la déplacer de tant de
// pixels, ou d'un pas au clavier. Ils ne savent rien de la vue elle-même (vue.ts) ; ils se vérifient avec des
// événements simulés.

/** Ce que les gestes demandent à la carte. */
export type Commandes = {
  /** US-0420 : la faire glisser de (dx, dy) pixels, ce qu'il y avait sous le pointeur restant sous lui. */
  deplacer: (dx: number, dy: number) => void;
  /** US-0422 : la faire avancer d'un pas, en colonnes vers l'est (1) ou l'ouest (-1), en rangées vers le sud (1) ou le nord (-1). */
  avancer: (colonnes: number, rangees: number) => void;
  /** US-0423 : la zoomer d'un facteur (plus de 1 : rapprocher) autour du point (x, y), en pixels depuis son coin en haut à gauche. */
  zoomer: (facteur: number, x: number, y: number) => void;
};

/** US-0422 : où chaque flèche du clavier fait regarder la carte, en colonnes et en rangées. */
const FLECHES: Record<string, [number, number]> = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] };

/**
 * US-0423 : de combien de pixels doit tourner la molette pour doubler la taille des Cases (ou la diviser par deux) ;
 * le geste de zoom du pavé tactile, annoncé en plus petits pas, va trois fois plus vite. Une molette qui tourne par
 * lignes compte 40 pixels la ligne.
 */
const MOLETTE_PIXELS_PAR_DOUBLEMENT = { molette: 300, pave: 100 };
const PIXELS_PAR_LIGNE = 40;

/** US-0423 : le pincement du pavé tactile tel que Safari l'annonce, hors des événements standard : son échelle depuis son début. */
type GesteSafari = Event & { scale: number; clientX: number; clientY: number };

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
 * pas ; avec Alt, Ctrl ou Cmd, la flèche reste au navigateur (revenir à la page d'avant…). US-0423 : la molette et
 * le geste de zoom du pavé tactile la zooment autour du pointeur, à la place de la page.
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
  // US-0423 : un point de la page, repéré depuis le coin en haut à gauche de la carte.
  const surLaCarte = (e: { clientX: number; clientY: number }) => {
    const { left, top } = element.getBoundingClientRect();
    return [e.clientX - left, e.clientY - top] as const;
  };
  // US-0423 : la molette, ou le geste de zoom du pavé tactile (une molette avec Ctrl), zoome autour du pointeur,
  // d'autant plus qu'elle tourne ; ni la page ni son zoom ne bougent.
  const tourner = (e: WheelEvent) => {
    e.preventDefault();
    const pixels = e.deltaMode === WheelEvent.DOM_DELTA_PIXEL ? e.deltaY : e.deltaMode === WheelEvent.DOM_DELTA_LINE ? e.deltaY * PIXELS_PAR_LIGNE : e.deltaY * element.clientHeight;
    commandes.zoomer(2 ** (-pixels / MOLETTE_PIXELS_PAR_DOUBLEMENT[e.ctrlKey ? "pave" : "molette"]), ...surLaCarte(e));
  };
  // US-0423 : sous Safari, le pincement du pavé tactile, son échelle comptée depuis le début du geste.
  let echelle = 1;
  const pincerSousSafari = (e: GesteSafari) => {
    e.preventDefault();
    if (e.type === "gesturestart") echelle = 1;
    if (e.type !== "gesturechange") return;
    commandes.zoomer(e.scale / echelle, ...surLaCarte(e));
    echelle = e.scale;
  };

  const ecoutes: [string, (e: never) => void, AddEventListenerOptions?][] = [
    ["pointerdown", poser],
    ["pointermove", bouger],
    ["pointerup", lever],
    ["pointercancel", lever],
    ["keydown", appuyer],
    // Le navigateur ne laisse empêcher le défilement ou le zoom de la page qu'à un écouteur qui le dit à l'avance.
    ["wheel", tourner, { passive: false }],
    ["gesturestart", pincerSousSafari],
    ["gesturechange", pincerSousSafari],
    ["gestureend", pincerSousSafari],
  ];
  for (const [type, rappel, options] of ecoutes) element.addEventListener(type, rappel as EventListener, options);
  return () => {
    for (const [type, rappel] of ecoutes) element.removeEventListener(type, rappel as EventListener);
  };
}
