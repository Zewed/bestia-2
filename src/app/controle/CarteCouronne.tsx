import type { CouronneEnBase } from "@/monde/en-base";
import { centre } from "@/monde/hex";
import styles from "./page.module.css";

/** La couleur de chaque Biome, prise dans la palette ; un Biome inconnu reste en gris galet. */
const COULEURS: Record<string, string> = {
  prairie: "var(--biome-prairie)",
  foret: "var(--biome-foret)",
  jungle: "var(--biome-jungle)",
  savane: "var(--biome-savane)",
  desert: "var(--biome-desert)",
  montagne: "var(--biome-montagne)",
  toundra: "var(--biome-toundra)",
  banquise: "var(--biome-banquise)",
  eau: "var(--biome-eau)",
};
const couleur = (biome: string) => COULEURS[biome] ?? "var(--galet)";

const SOMMETS = Array.from({ length: 6 }, (_, i) => {
  const angle = (Math.PI / 180) * (60 * i - 30);
  return { x: Math.cos(angle), y: Math.sin(angle) };
});

/** Le contour d'une Case, en coordonnées du plan. */
function hexagone(q: number, r: number): string {
  const { x, y } = centre({ q, r });
  return `M${SOMMETS.map((s) => `${(x + s.x).toFixed(2)} ${(y + s.y).toFixed(2)}`).join("L")}Z`;
}

/**
 * La Couronne vue d'en haut (US-0151), pour vérifier la répartition des Biomes : une forme par
 * Biome, dans sa couleur de la palette, et la légende avec la part de chacun.
 */
export function CarteCouronne({ couronne, noms }: { couronne: CouronneEnBase; noms: Record<string, string> }) {
  const parBiome = new Map<string, { q: number; r: number }[]>();
  for (const c of couronne.cases) parBiome.set(c.biome, [...(parBiome.get(c.biome) ?? []), c]);
  const etendue = Math.max(...couronne.cases.map((c) => Math.abs(centre(c).x)), ...couronne.cases.map((c) => Math.abs(centre(c).y))) + 2;
  const biomes = [...parBiome.entries()].sort((a, b) => b[1].length - a[1].length);
  return (
    <div className={styles.carte}>
      <svg viewBox={`${-etendue} ${-etendue} ${2 * etendue} ${2 * etendue}`} role="img" aria-label={`La Couronne de ${couronne.monde}, ${couronne.cases.length} Cases`}>
        {biomes.map(([biome, cases]) => (
          <path key={biome} data-biome={biome} d={cases.map((c) => hexagone(c.q, c.r)).join("")} style={{ fill: couleur(biome) }} />
        ))}
      </svg>
      <ul className={styles.legende}>
        {biomes.map(([biome, cases]) => (
          <li key={biome}>
            <span className={styles.pastille} style={{ background: couleur(biome) }} aria-hidden="true" />
            {noms[biome] ?? biome}
            <span className={styles.note}>
              {cases.length} · {Math.round((100 * cases.length) / couronne.cases.length)} %
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
