// Ce que montre la carte du Monde d'un geste à l'autre (US-0420) : où regarde le milieu de l'écran, et de quelle
// taille sont les Cases. Des calculs seuls, sans rien demander au navigateur : ils se vérifient à part. Le dessin
// (dessin.ts) reçoit la vue telle quelle ; son milieu est une Case en coordonnées non entières, entre deux Cases.
import { anneau, centre, DIRECTIONS, type Coordonnees } from "@/monde/hex";
import { CARTE_DEBORD_CASES } from "@/reglages";
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
