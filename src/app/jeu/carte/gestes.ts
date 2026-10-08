// Les gestes du joueur sur la carte du Monde (US-0420), traduits en demandes à la carte : la déplacer de tant de
// pixels, ou d'un pas au clavier. Ils ne savent rien de la vue elle-même (vue.ts) ; ils se vérifient avec des
// événements simulés.
import { CARTE_TOUCHER_PIXELS } from "@/reglages";

/** Ce que les gestes demandent à la carte. */
export type Commandes = {
  /** US-0420 : la faire glisser de (dx, dy) pixels, ce qu'il y avait sous le pointeur restant sous lui. */
  deplacer: (dx: number, dy: number) => void;
  /** US-0422 : la faire avancer d'un pas, en colonnes vers l'est (1) ou l'ouest (-1), en rangées vers le sud (1) ou le nord (-1). */
  avancer: (colonnes: number, rangees: number) => void;
  /** US-0423 : la zoomer d'un facteur (plus de 1 : rapprocher) autour du point (x, y), en pixels depuis son coin en haut à gauche. */
  zoomer: (facteur: number, x: number, y: number) => void;
  /** US-0428 : un toucher (ou un clic) en (x, y), en pixels depuis son coin en haut à gauche. */
  toucher: (x: number, y: number) => void;
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

/** Un point de la page, en pixels. */
type Point = { x: number; y: number };

/** US-0424 : le point à mi-chemin entre deux doigts. */
function milieuEntre(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/**
 * US-0420 : de combien de pixels un pointeur appuyé doit bouger avant qu'on le prenne pour un glissement : en
 * deçà, c'est un clic, même si la main tremble un peu. US-0421 : un doigt bouge davantage en se posant qu'une
 * souris (ou un stylet) : un toucher bref ne déplace rien. US-0428 : en deçà, relâché, c'est un toucher.
 */
export const SEUIL_DE_GLISSEMENT = CARTE_TOUCHER_PIXELS;

/**
 * US-0420 : suit les gestes du joueur sur la carte (`element`) et les transmet à `commandes`, jusqu'à l'appel de
 * la fonction rendue. Glisser en gardant le bouton principal appuyé déplace la carte, d'autant que la souris
 * depuis l'endroit où il a été appuyé, une fois passé le seuil de glissement ; la carte garde la souris quand
 * elle sort de l'écran en chemin. US-0421 : de même au doigt, ces mêmes événements du navigateur valant pour la
 * souris, le doigt et le stylet. US-0422 : la carte sélectionnée, chaque flèche du clavier la fait avancer d'un
 * pas ; avec Alt, Ctrl ou Cmd, la flèche reste au navigateur (revenir à la page d'avant…). US-0423 : la molette et
 * le geste de zoom du pavé tactile la zooment autour du pointeur, à la place de la page. US-0424 : deux doigts
 * posés la zooment d'autant qu'ils s'écartent ou se rapprochent, autour du point entre eux, qu'elle suit ; un
 * troisième ne compte pas, et le doigt qui reste quand l'autre se lève continue de la faire glisser. US-0428 : un
 * pointeur seul relâché avant le seuil de glissement touche la carte là où il s'est posé ; un pincement n'est jamais un
 * toucher. Entrée, la carte sélectionnée, touche son milieu.
 */
export function suivreLesGestes(element: HTMLElement, commandes: Commandes): () => void {
  // Les pointeurs posés sur la carte, deux au plus, à leur dernière position prise en compte, dans la page.
  const poses = new Map<number, Point>();
  // Le glissement d'un pointeur seul : là où il s'est posé, son seuil de glissement, et s'il glisse déjà.
  let glissement: { depart: Point; seuil: number; glisse: boolean } | null = null;
  // US-0423 : un point de la page, repéré depuis le coin en haut à gauche de la carte.
  const surLaCarte = (p: Point) => {
    const { left, top } = element.getBoundingClientRect();
    return [p.x - left, p.y - top] as const;
  };

  const poser = (e: PointerEvent) => {
    if (e.button !== 0 || poses.size === 2 || (poses.size === 1 && e.pointerType !== "touch")) return;
    element.setPointerCapture(e.pointerId);
    const ici = { x: e.clientX, y: e.clientY };
    poses.set(e.pointerId, ici);
    // US-0424 : un second doigt fait un pincement, pas un glissement.
    glissement = poses.size === 1 ? { depart: ici, seuil: e.pointerType === "touch" ? SEUIL_DE_GLISSEMENT.doigt : SEUIL_DE_GLISSEMENT.souris, glisse: false } : null;
  };
  const bouger = (e: PointerEvent) => {
    const avant = poses.get(e.pointerId);
    if (!avant) return;
    const ici = { x: e.clientX, y: e.clientY };
    if (glissement) {
      if (!glissement.glisse && Math.hypot(ici.x - glissement.depart.x, ici.y - glissement.depart.y) < glissement.seuil) return;
      glissement.glisse = true;
      commandes.deplacer(ici.x - avant.x, ici.y - avant.y);
    } else {
      // US-0424 : le doigt qui bouge, face à l'autre : le zoom autour de leur milieu d'avant, puis la carte qui suit ce milieu.
      const autre = [...poses].find(([id]) => id !== e.pointerId)![1];
      const [milieuAvant, milieuApres] = [milieuEntre(avant, autre), milieuEntre(ici, autre)];
      const [ecartAvant, ecartApres] = [Math.hypot(avant.x - autre.x, avant.y - autre.y), Math.hypot(ici.x - autre.x, ici.y - autre.y)];
      if (ecartAvant > 0 && ecartApres > 0) commandes.zoomer(ecartApres / ecartAvant, ...surLaCarte(milieuAvant));
      commandes.deplacer(milieuApres.x - milieuAvant.x, milieuApres.y - milieuAvant.y);
    }
    poses.set(e.pointerId, ici);
  };
  const lever = (e: PointerEvent) => {
    if (!poses.delete(e.pointerId)) return;
    // US-0428 : un pointeur seul, relâché sans avoir glissé : un toucher, là où il s'était posé.
    if (e.type === "pointerup" && poses.size === 0 && glissement && !glissement.glisse) commandes.toucher(...surLaCarte(glissement.depart));
    // US-0424 : le doigt qui reste après un pincement fait glisser la carte dès qu'il bouge, sans à-coup.
    const [reste] = poses.values();
    glissement = reste ? { depart: reste, seuil: 0, glisse: true } : null;
  };
  // US-0422 : une flèche fait avancer la carte d'un pas ; la page, elle, ne défile pas. US-0428 : Entrée touche son milieu.
  const appuyer = (e: KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === "Enter") {
      const { width, height } = element.getBoundingClientRect();
      commandes.toucher(width / 2, height / 2);
      return;
    }
    const sens = FLECHES[e.key];
    if (!sens) return;
    e.preventDefault();
    commandes.avancer(...sens);
  };
  // US-0423 : la molette, ou le geste de zoom du pavé tactile (une molette avec Ctrl), zoome autour du pointeur,
  // d'autant plus qu'elle tourne ; ni la page ni son zoom ne bougent.
  const tourner = (e: WheelEvent) => {
    e.preventDefault();
    const pixels = e.deltaMode === WheelEvent.DOM_DELTA_PIXEL ? e.deltaY : e.deltaMode === WheelEvent.DOM_DELTA_LINE ? e.deltaY * PIXELS_PAR_LIGNE : e.deltaY * element.clientHeight;
    commandes.zoomer(2 ** (-pixels / MOLETTE_PIXELS_PAR_DOUBLEMENT[e.ctrlKey ? "pave" : "molette"]), ...surLaCarte({ x: e.clientX, y: e.clientY }));
  };
  // US-0423 : sous Safari, le pincement du pavé tactile, son échelle comptée depuis le début du geste. US-0424 :
  // Safari annonce aussi ainsi le pincement à deux doigts sur l'écran, déjà suivi par ses doigts posés : le zoom du
  // navigateur est empêché, sans zoomer deux fois.
  let echelle = 1;
  const pincerSousSafari = (e: GesteSafari) => {
    e.preventDefault();
    if (e.type === "gesturestart") echelle = 1;
    if (e.type !== "gesturechange" || poses.size > 0) return;
    commandes.zoomer(e.scale / echelle, ...surLaCarte({ x: e.clientX, y: e.clientY }));
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
