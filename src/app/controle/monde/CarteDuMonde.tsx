import { centre, voisines, type Coordonnees } from "@/monde/hex";
import type { CaseDeCarte } from "./bilan";
import styles from "./monde.module.css";

/** La couleur de chaque Biome et de chaque eau, prise dans la palette ; une teinte inconnue reste en gris galet. */
export const COULEURS: Record<string, string> = {
  prairie: "var(--biome-prairie)",
  foret: "var(--biome-foret)",
  jungle: "var(--biome-jungle)",
  savane: "var(--biome-savane)",
  desert: "var(--biome-desert)",
  montagne: "var(--biome-montagne)",
  toundra: "var(--biome-toundra)",
  banquise: "var(--biome-banquise)",
  eau: "var(--biome-eau)",
  mer: "var(--biome-eau)",
  cote: "var(--ardoise)",
  lac: "var(--sarcelle-fonce)",
  riviere: "var(--ciel-fonce)",
};
export const couleur = (teinte: string) => COULEURS[teinte] ?? "var(--galet)";

/** La teinte d'une Case sur la carte : sa variante d'eau, sinon son Biome. */
export const teinteDe = (c: { biome: string; variante: string | null }) => (c.biome === "eau" && c.variante ? c.variante : c.biome);

/*
 * Les Cases se dessinent dans un plan aux coordonnées entières : X = 2q + r, Y = 3r, où une Case a pour
 * sommets (±1, ±1) et (0, ±2) autour de son centre ; une mise à l'échelle (√3/2, 1/2) la rend régulière.
 * Le chemin d'une Case tient ainsi en quelques caractères : 10 981 Cases font une carte légère.
 */
const ECHELLE = `scale(${Math.sqrt(3) / 2} 0.5)`;
const SOMMETS = [
  [1, -1],
  [1, 1],
  [0, 2],
  [-1, 1],
  [-1, -1],
  [0, -2],
] as const;
const plan = ({ q, r }: Coordonnees) => ({ x: 2 * q + r, y: 3 * r });

/** Le contour d'une Case ; un Foyer, en plus petit au milieu. */
function hexagone(c: Coordonnees): string {
  const { x, y } = plan(c);
  return `M${x + 1} ${y - 1}v2l-1 1-1-1v-2l1-1z`;
}
function foyer(c: Coordonnees): string {
  const { x, y } = plan(c);
  return `M${x + 0.5} ${y - 0.5}v1l-.5 .5-.5-.5v-1l.5-.5z`;
}

/** Le bord d'un ensemble de Cases : chaque côté d'une de ses Cases qui ne touche pas une autre des siennes. */
function bord(cases: Coordonnees[]): string {
  const dans = new Set(cases.map((c) => `${c.q},${c.r}`));
  return cases
    .flatMap((c) => {
      const { x, y } = plan(c);
      return voisines(c).flatMap((v, i) => {
        if (dans.has(`${v.q},${v.r}`)) return [];
        // Le côté vers la voisine de la direction i va du sommet (6 − i) au suivant.
        const [a, b] = [SOMMETS[(6 - i) % 6], SOMMETS[(7 - i) % 6]];
        return [`M${x + a[0]} ${y + a[1]}l${b[0] - a[0]} ${b[1] - a[1]}`];
      });
    })
    .join("");
}

/**
 * US-0412 : le Monde entier vu d'en haut, sans brouillard : une forme par teinte (chaque Biome, chaque eau),
 * la Couronne et le Cœur sauvage cernés d'Encre, un point sur chaque emplacement de naissance libre, et
 * chaque Foyer d'un hexagone plein.
 */
export function CarteDuMonde({ titre, cases, emplacements, foyers }: { titre: string; cases: CaseDeCarte[]; emplacements: Coordonnees[]; foyers: Coordonnees[] }) {
  const parTeinte = new Map<string, Coordonnees[]>();
  for (const c of cases) parTeinte.set(teinteDe(c), [...(parTeinte.get(teinteDe(c)) ?? []), c]);
  const teintes = [...parTeinte.entries()].sort((a, b) => b[1].length - a[1].length);
  const etendue = Math.max(1, ...cases.map((c) => Math.abs(centre(c).x)), ...cases.map((c) => Math.abs(centre(c).y) * (2 / Math.sqrt(3)))) + 1.5;
  const [largeur, hauteur] = [etendue, etendue * (Math.sqrt(3) / 2)].map((n) => Math.ceil(n * 10) / 10);
  return (
    <svg className={styles.carte} viewBox={`${-largeur} ${-hauteur} ${2 * largeur} ${2 * hauteur}`} role="img" aria-label={titre}>
      <g transform={ECHELLE}>
        {teintes.map(([teinte, siennes]) => (
          <path key={teinte} data-teinte={teinte} d={siennes.map(hexagone).join("")} style={{ fill: couleur(teinte), stroke: couleur(teinte) }} className={styles.teinte} />
        ))}
        <path data-bord="couronne" className={styles.bord} d={bord(cases.filter((c) => c.couronne))} />
        <path data-bord="coeur" className={`${styles.bord} ${styles.coeur}`} d={bord(cases.filter((c) => c.coeur))} />
        {foyers.length > 0 ? <path className={styles.foyers} d={foyers.map(foyer).join("")} /> : null}
      </g>
      <g className={styles.emplacements}>
        {emplacements.map((e) => {
          const { x, y } = centre(e);
          return <circle key={`${e.q},${e.r}`} cx={x.toFixed(2)} cy={y.toFixed(2)} r="0.7" />;
        })}
      </g>
    </svg>
  );
}
