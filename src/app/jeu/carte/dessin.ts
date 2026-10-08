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
export type Pinceau = Pick<
  CanvasRenderingContext2D,
  "fillStyle" | "strokeStyle" | "lineWidth" | "lineCap" | "lineJoin" | "clearRect" | "beginPath" | "moveTo" | "lineTo" | "quadraticCurveTo" | "arc" | "closePath" | "fill" | "stroke"
>;

/**
 * Les couleurs de la carte, telles que le <canvas> les comprend : le fond de chaque teinte, dans l'ordre des
 * teintes de la carte (US-0418), le bord léger des Cases, et les deux tons des motifs : un sombre pour les teintes
 * claires, un clair pour les sombres.
 */
export type Peinture = { fonds: string[]; bord: string; motifSombre: string; motifClair: string };

/** La carte telle que le serveur l'envoie : ses teintes, et ses Cases en colonnes (src/monde/carte.ts). */
export type CarteADessiner = { teintes: string[]; cases: { q: number[]; r: number[]; teinte: number[] } };

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
 * US-0418 : le motif d'une teinte, posé au milieu de chaque Case de cette teinte : un petit dessin plat, dans le
 * ton sombre sur les teintes claires et le ton clair sur les sombres, rempli ou tracé d'un trait rond. `dessiner`
 * l'ajoute au tracé en cours, la Case centrée en (x, y) et de rayon s ; il reste à moins de 0,6 s du centre.
 */
type Motif = { ton: "sombre" | "clair"; geste: "remplir" | "tracer"; dessiner: (p: Pinceau, x: number, y: number, s: number) => void };

/** Une touffe d'herbe : trois brins qui partent d'un même pied. */
function touffe(p: Pinceau, x: number, y: number, s: number) {
  for (const [dx, dy] of [
    [-0.13, -0.17],
    [0, -0.24],
    [0.13, -0.17],
  ]) {
    p.moveTo(x, y);
    p.lineTo(x + dx * s, y + dy * s);
  }
}

/** Un sapin : un triangle pointe en haut. */
function sapin(p: Pinceau, x: number, y: number, s: number) {
  p.moveTo(x, y - 0.3 * s);
  p.lineTo(x + 0.16 * s, y + 0.16 * s);
  p.lineTo(x - 0.16 * s, y + 0.16 * s);
  p.closePath();
}

/** Un rond plein de rayon r (en rayons de Case), centré en (x, y). */
function rond(p: Pinceau, x: number, y: number, r: number) {
  p.moveTo(x + r, y);
  p.arc(x, y, r, 0, 2 * Math.PI);
}

/** Une vague : deux creux de largeur totale 2 l (en pixels), d'amplitude a. */
function vague(p: Pinceau, x: number, y: number, l: number, a: number) {
  p.moveTo(x - l, y);
  p.quadraticCurveTo(x - l / 2, y - a, x, y);
  p.quadraticCurveTo(x + l / 2, y + a, x + l, y);
}

/** US-0418 : le motif de chaque Biome de terre et de chaque eau, tous différents. */
export const MOTIFS: Record<string, Motif> = {
  // Des touffes d'herbe.
  prairie: {
    ton: "sombre",
    geste: "tracer",
    dessiner: (p, x, y, s) => {
      touffe(p, x - 0.26 * s, y + 0.2 * s, s);
      touffe(p, x + 0.24 * s, y + 0.02 * s, s);
    },
  },
  // Deux sapins.
  foret: {
    ton: "sombre",
    geste: "remplir",
    dessiner: (p, x, y, s) => {
      sapin(p, x - 0.2 * s, y + 0.06 * s, s);
      sapin(p, x + 0.2 * s, y - 0.04 * s, s);
    },
  },
  // Des feuillages ronds, serrés.
  jungle: {
    ton: "clair",
    geste: "remplir",
    dessiner: (p, x, y, s) => {
      rond(p, x - 0.19 * s, y - 0.08 * s, 0.15 * s);
      rond(p, x + 0.19 * s, y - 0.12 * s, 0.13 * s);
      rond(p, x + 0.02 * s, y + 0.2 * s, 0.15 * s);
    },
  },
  // Un acacia : une ombrelle plate sur un tronc fin.
  savane: {
    ton: "sombre",
    geste: "remplir",
    dessiner: (p, x, y, s) => {
      p.moveTo(x - 0.34 * s, y - 0.06 * s);
      p.quadraticCurveTo(x, y - 0.36 * s, x + 0.34 * s, y - 0.06 * s);
      p.closePath();
      p.moveTo(x - 0.035 * s, y - 0.06 * s);
      p.lineTo(x + 0.035 * s, y - 0.06 * s);
      p.lineTo(x + 0.035 * s, y + 0.3 * s);
      p.lineTo(x - 0.035 * s, y + 0.3 * s);
      p.closePath();
    },
  },
  // Deux dunes.
  desert: {
    ton: "sombre",
    geste: "tracer",
    dessiner: (p, x, y, s) => {
      p.moveTo(x - 0.42 * s, y + 0.02 * s);
      p.quadraticCurveTo(x - 0.2 * s, y - 0.22 * s, x + 0.02 * s, y + 0.02 * s);
      p.moveTo(x - 0.04 * s, y + 0.3 * s);
      p.quadraticCurveTo(x + 0.18 * s, y + 0.06 * s, x + 0.4 * s, y + 0.3 * s);
    },
  },
  // Un massif à deux sommets.
  montagne: {
    ton: "sombre",
    geste: "remplir",
    dessiner: (p, x, y, s) => {
      p.moveTo(x - 0.42 * s, y + 0.24 * s);
      p.lineTo(x - 0.08 * s, y - 0.32 * s);
      p.lineTo(x + 0.1 * s, y - 0.02 * s);
      p.lineTo(x + 0.2 * s, y - 0.16 * s);
      p.lineTo(x + 0.42 * s, y + 0.24 * s);
      p.closePath();
    },
  },
  // Des lichens, en points épars.
  toundra: {
    ton: "sombre",
    geste: "remplir",
    dessiner: (p, x, y, s) => {
      rond(p, x - 0.26 * s, y - 0.1 * s, 0.06 * s);
      rond(p, x + 0.04 * s, y + 0.18 * s, 0.06 * s);
      rond(p, x + 0.3 * s, y - 0.14 * s, 0.06 * s);
      rond(p, x - 0.04 * s, y - 0.32 * s, 0.05 * s);
    },
  },
  // Une fêlure dans la glace.
  banquise: {
    ton: "sombre",
    geste: "tracer",
    dessiner: (p, x, y, s) => {
      p.moveTo(x - 0.36 * s, y - 0.18 * s);
      p.lineTo(x - 0.1 * s, y + 0.02 * s);
      p.lineTo(x + 0.06 * s, y - 0.12 * s);
      p.lineTo(x + 0.36 * s, y + 0.18 * s);
      p.moveTo(x + 0.06 * s, y - 0.12 * s);
      p.lineTo(x + 0.12 * s, y - 0.36 * s);
    },
  },
  // L'écume du rivage, en trois points.
  cote: {
    ton: "clair",
    geste: "remplir",
    dessiner: (p, x, y, s) => {
      rond(p, x - 0.26 * s, y + 0.06 * s, 0.055 * s);
      rond(p, x, y - 0.06 * s, 0.055 * s);
      rond(p, x + 0.26 * s, y + 0.06 * s, 0.055 * s);
    },
  },
  // Des ronds dans l'eau.
  lac: {
    ton: "clair",
    geste: "tracer",
    dessiner: (p, x, y, s) => {
      p.moveTo(x + 0.3 * s, y);
      p.arc(x, y, 0.3 * s, 0, 2 * Math.PI);
      p.moveTo(x + 0.12 * s, y);
      p.arc(x, y, 0.12 * s, 0, 2 * Math.PI);
    },
  },
  // Le courant, d'une seule longue ondulation.
  riviere: {
    ton: "clair",
    geste: "tracer",
    dessiner: (p, x, y, s) => vague(p, x, y, 0.44 * s, 0.3 * s),
  },
  // Deux vagues.
  mer: {
    ton: "clair",
    geste: "tracer",
    dessiner: (p, x, y, s) => {
      vague(p, x - 0.1 * s, y - 0.14 * s, 0.22 * s, 0.22 * s);
      vague(p, x + 0.1 * s, y + 0.18 * s, 0.22 * s, 0.22 * s);
    },
  },
};

/**
 * US-0417 : dessine les Cases du Monde en hexagones, en colonnes comme le serveur les envoie. Seules celles qui
 * touchent l'écran sont tracées. US-0418 : chacune de la couleur de sa teinte (son Biome, ou sa variante d'eau),
 * puis le motif de sa teinte par-dessus, d'un geste par teinte ; enfin une légère bordure d'un pixel entre toutes.
 */
export function dessinerLaCarte(pinceau: Pinceau, carte: CarteADessiner, vue: Vue, peinture: Peinture) {
  pinceau.clearRect(0, 0, vue.largeur, vue.hauteur);
  // Les Cases à l'écran, rangées par teinte : le centre de chacune, en pixels.
  const parTeinte = carte.teintes.map((): { x: number; y: number }[] => []);
  const { q, r, teinte } = carte.cases;
  for (let i = 0; i < q.length; i++) {
    const ici = aLEcran({ q: q[i], r: r[i] }, vue);
    if (aLaVue(ici.x, ici.y, vue)) parTeinte[teinte[i]].push(ici);
  }
  parTeinte.forEach((centres, t) => {
    pinceau.beginPath();
    for (const { x, y } of centres) tracerLaCase(pinceau, x, y, vue.rayon);
    pinceau.fillStyle = peinture.fonds[t];
    pinceau.fill();
  });
  parTeinte.forEach((centres, t) => {
    const motif = MOTIFS[carte.teintes[t]];
    if (!motif || centres.length === 0) return;
    pinceau.beginPath();
    for (const { x, y } of centres) motif.dessiner(pinceau, x, y, vue.rayon);
    const ton = motif.ton === "sombre" ? peinture.motifSombre : peinture.motifClair;
    if (motif.geste === "remplir") {
      pinceau.fillStyle = ton;
      pinceau.fill();
    } else {
      pinceau.strokeStyle = ton;
      pinceau.lineWidth = Math.max(1, vue.rayon * 0.09);
      pinceau.lineCap = "round";
      pinceau.lineJoin = "round";
      pinceau.stroke();
    }
  });
  pinceau.beginPath();
  for (const centres of parTeinte) for (const { x, y } of centres) tracerLaCase(pinceau, x, y, vue.rayon);
  pinceau.strokeStyle = peinture.bord;
  pinceau.lineWidth = 1;
  pinceau.stroke();
}
