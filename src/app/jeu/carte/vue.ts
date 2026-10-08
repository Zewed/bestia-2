// Ce que montre la carte du Monde d'un geste à l'autre (US-0420) : où regarde le milieu de l'écran, et de quelle
// taille sont les Cases. Des calculs seuls, sans rien demander au navigateur : ils se vérifient à part. Le dessin
// (dessin.ts) reçoit la vue telle quelle ; son milieu est une Case en coordonnées non entières, entre deux Cases.
import { anneau, centre, DIRECTIONS, type Coordonnees } from "@/monde/hex";
import { CARTE_DEBORD_CASES, CARTE_PAS_CLAVIER_CASES, CARTE_ZOOM_LARGE_CASES, CARTE_ZOOM_PROCHE_CASES } from "@/reglages";
import type { CarteADessiner, Vue } from "./dessin";

/** Un point du plan de `centre`, où une Case a un rayon de 1. */
type Point = { x: number; y: number };

/** L'inverse de `centre` : la Case, en coordonnées non entières, dont le centre tombe en p. */
function depuisLePlan(p: Point): Coordonnees {
  const r = p.y / 1.5;
  return { q: p.x / Math.sqrt(3) - r / 2, r };
}

/** Le point du segment [a, b] le plus proche de p. */
function surLeSegment(p: Point, a: Point, b: Point): Point {
  const [dx, dy] = [b.x - a.x, b.y - a.y];
  const t = Math.min(1, Math.max(0, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
  return { x: a.x + t * dx, y: a.y + t * dy };
}

/**
 * US-0420 : jusqu'où peut aller le milieu de l'écran, en anneau : CARTE_DEBORD_CASES au-delà de la Case de la
 * carte la plus éloignée du centre. Sur Aube, qui n'a en base que sa Couronne, c'est encore le bord du Monde.
 */
export function limiteDeLaCarte(carte: CarteADessiner): number {
  let plusLoin = anneau(carte.foyer);
  for (let i = 0; i < carte.cases.q.length; i++) plusLoin = Math.max(plusLoin, anneau({ q: carte.cases.q[i], r: carte.cases.r[i] }));
  return plusLoin + CARTE_DEBORD_CASES;
}

/**
 * US-0420 : la vue, son milieu ramené à au plus `limite` Cases du centre du Monde : au point le plus proche du
 * grand hexagone de ce rayon. Arrêtée contre son bord, la carte glisse encore le long de lui.
 */
export function borner(vue: Vue, limite: number): Vue {
  if (anneau(vue.milieu) <= limite) return vue;
  const ici = centre(vue.milieu);
  const coins = DIRECTIONS.map((d) => centre({ q: d.q * limite, r: d.r * limite }));
  const auBord = coins
    .map((coin, i) => surLeSegment(ici, coin, coins[(i + 1) % coins.length]))
    .reduce((a, b) => (Math.hypot(a.x - ici.x, a.y - ici.y) <= Math.hypot(b.x - ici.x, b.y - ici.y) ? a : b));
  return { ...vue, milieu: depuisLePlan(auBord) };
}

/**
 * US-0420 : la vue après avoir fait glisser la carte de (dx, dy) pixels : chaque Case se déplace d'autant à
 * l'écran, sans que le milieu sorte des limites.
 */
export function deplacer(vue: Vue, dx: number, dy: number, limite: number): Vue {
  const ici = centre(vue.milieu);
  return borner({ ...vue, milieu: depuisLePlan({ x: ici.x - dx / vue.rayon, y: ici.y - dy / vue.rayon }) }, limite);
}

/**
 * US-0422 : la vue après un appui sur une flèche du clavier : elle regarde CARTE_PAS_CLAVIER_CASES Cases plus loin,
 * en colonnes vers l'est (1) ou l'ouest (-1), en rangées vers le sud (1) ou le nord (-1), dans les mêmes limites.
 */
export function avancer(vue: Vue, colonnes: number, rangees: number, limite: number): Vue {
  // D'une colonne à l'autre, la largeur d'une Case ; d'une rangée à l'autre, une fois et demie son rayon.
  const [colonne, rangee] = [Math.sqrt(3) * vue.rayon, 1.5 * vue.rayon];
  return deplacer(vue, -colonnes * CARTE_PAS_CLAVIER_CASES * colonne, -rangees * CARTE_PAS_CLAVIER_CASES * rangee, limite);
}

/**
 * US-0423 : le plus petit et le plus grand rayon d'une Case à l'écran, en pixels, sur une carte de `largeur` ×
 * `hauteur` pixels : de la vue large, où la moitié de sa plus petite dimension couvre CARTE_ZOOM_LARGE_CASES
 * largeurs de Case, à la vue rapprochée, où elle n'en couvre que CARTE_ZOOM_PROCHE_CASES.
 */
export function bornesDuZoom(largeur: number, hauteur: number): { min: number; max: number } {
  const rayonPour = (cases: number) => Math.min(largeur, hauteur) / 2 / cases / Math.sqrt(3);
  return { min: rayonPour(CARTE_ZOOM_LARGE_CASES), max: rayonPour(CARTE_ZOOM_PROCHE_CASES) };
}

/** US-0423 : le rayon d'une Case ramené dans les bornes du zoom ; tel quel tant que la carte n'a pas de place à l'écran. */
function dansLesBornes(rayon: number, largeur: number, hauteur: number): number {
  if (Math.min(largeur, hauteur) <= 0) return rayon;
  const { min, max } = bornesDuZoom(largeur, hauteur);
  return Math.min(max, Math.max(min, rayon));
}

/**
 * US-0425 : si l'on peut encore rapprocher la carte, ou l'éloigner, ou si le zoom est à sa borne (à un milliardième
 * près, les calculs n'y arrivant pas toujours tout juste). Une carte sans place à l'écran ne zoome pas.
 */
export function zoomPossible(vue: Vue): { rapprocher: boolean; eloigner: boolean } {
  if (Math.min(vue.largeur, vue.hauteur) <= 0) return { rapprocher: false, eloigner: false };
  const { min, max } = bornesDuZoom(vue.largeur, vue.hauteur);
  return { rapprocher: vue.rayon < max * (1 - 1e-9), eloigner: vue.rayon > min * (1 + 1e-9) };
}

/**
 * US-0423 : la vue sur une carte de `largeur` × `hauteur` pixels, à l'ouverture ou quand l'écran change de taille :
 * le même endroit au milieu, le zoom ramené dans ses bornes pour cette taille.
 */
export function cadrer(vue: Vue, largeur: number, hauteur: number): Vue {
  return { ...vue, largeur, hauteur, rayon: dansLesBornes(vue.rayon, largeur, hauteur) };
}

/**
 * US-0423 : la vue après avoir zoomé d'un `facteur` (plus de 1 : rapprocher) autour du point (x, y) de la carte, en
 * pixels depuis son coin en haut à gauche : ce qui était sous ce point y reste. Le zoom s'arrête à ses bornes, le
 * milieu aux limites de la carte.
 */
export function zoomer(vue: Vue, facteur: number, x: number, y: number, limite: number): Vue {
  const rayon = dansLesBornes(vue.rayon * facteur, vue.largeur, vue.hauteur);
  const [dx, dy] = [x - vue.largeur / 2, y - vue.hauteur / 2];
  const ici = centre(vue.milieu);
  const vise = { x: ici.x + dx / vue.rayon, y: ici.y + dy / vue.rayon };
  return borner({ ...vue, rayon, milieu: depuisLePlan({ x: vise.x - dx / rayon, y: vise.y - dy / rayon }) }, limite);
}
