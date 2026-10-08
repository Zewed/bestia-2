// Le dessin de la carte du Monde sur un <canvas> (US-0417), sans rien demander au navigateur : il se vérifie à part.
import { centre, SOMMETS_DE_CASE, type Coordonnees } from "@/monde/hex";

/** US-0417 : la largeur d'une Case à l'écran, d'un côté plat à l'autre, en pixels : un hexagone confortable. */
export const LARGEUR_DE_CASE = 28;

/**
 * Ce que montre la carte : la taille de l'écran en pixels, la Case posée en son milieu, et le rayon d'une Case à
 * l'écran (de son centre à un sommet), en pixels.
 */
export type Vue = { largeur: number; hauteur: number; milieu: Coordonnees; rayon: number };

/** Ce que la carte demande au pinceau d'un <canvas> : une petite partie de CanvasRenderingContext2D. */
export type Pinceau = Pick<CanvasRenderingContext2D, "fillStyle" | "strokeStyle" | "lineWidth" | "clearRect" | "beginPath" | "moveTo" | "lineTo" | "closePath" | "fill" | "stroke">;

/** Les couleurs de la carte, telles que le <canvas> les comprend : le fond des Cases et leur bord. */
export type Couleurs = { case: string; bord: string };

/** US-0417 : la carte à l'ouverture, sur un écran de `largeur` × `hauteur` pixels : le Foyer au milieu, des Cases de LARGEUR_DE_CASE pixels. */
export function vueSurLeFoyer(foyer: Coordonnees, largeur: number, hauteur: number): Vue {
  return { largeur, hauteur, milieu: foyer, rayon: LARGEUR_DE_CASE / Math.sqrt(3) };
}

/** Où tombe le centre d'une Case sur l'écran, en pixels depuis son coin en haut à gauche. */
export function aLEcran(c: Coordonnees, vue: Vue): { x: number; y: number } {
  const [ici, milieu] = [centre(c), centre(vue.milieu)];
  return { x: vue.largeur / 2 + (ici.x - milieu.x) * vue.rayon, y: vue.hauteur / 2 + (ici.y - milieu.y) * vue.rayon };
}

/** Si une Case dont le centre tombe en (x, y) touche l'écran : les autres ne sont pas dessinées. */
function aLaVue(x: number, y: number, vue: Vue): boolean {
  return x > -vue.rayon && x < vue.largeur + vue.rayon && y > -vue.rayon && y < vue.hauteur + vue.rayon;
}

/** Ajoute au tracé en cours l'hexagone d'une Case, centré en (x, y). */
function tracerLaCase(pinceau: Pinceau, x: number, y: number, rayon: number) {
  pinceau.moveTo(x + SOMMETS_DE_CASE[0].x * rayon, y + SOMMETS_DE_CASE[0].y * rayon);
  for (const s of SOMMETS_DE_CASE.slice(1)) pinceau.lineTo(x + s.x * rayon, y + s.y * rayon);
  pinceau.closePath();
}

/**
 * US-0417 : dessine les Cases du Monde en hexagones, en colonnes comme le serveur les envoie. Seules celles qui
 * touchent l'écran sont tracées, toutes d'un même tracé : un seul remplissage et un seul trait pour leurs bords.
 */
export function dessinerLaCarte(pinceau: Pinceau, cases: { q: number[]; r: number[] }, vue: Vue, couleurs: Couleurs) {
  pinceau.clearRect(0, 0, vue.largeur, vue.hauteur);
  pinceau.beginPath();
  for (let i = 0; i < cases.q.length; i++) {
    const { x, y } = aLEcran({ q: cases.q[i], r: cases.r[i] }, vue);
    if (aLaVue(x, y, vue)) tracerLaCase(pinceau, x, y, vue.rayon);
  }
  pinceau.fillStyle = couleurs.case;
  pinceau.fill();
  pinceau.strokeStyle = couleurs.bord;
  pinceau.lineWidth = 1;
  pinceau.stroke();
}
