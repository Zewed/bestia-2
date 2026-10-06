import type { CouronneEnBase } from "@/monde/en-base";
import { centre, type Coordonnees } from "@/monde/hex";
import { ALERTE_PLACES_DE_FOYER } from "@/reglages";
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

/** Le contour d'une Case, en coordonnées du plan ; `taille` le réduit autour de son centre. */
function hexagone(q: number, r: number, taille = 1): string {
  const { x, y } = centre({ q, r });
  return `M${SOMMETS.map((s) => `${(x + s.x * taille).toFixed(2)} ${(y + s.y * taille).toFixed(2)}`).join("L")}Z`;
}

/**
 * La Couronne vue d'en haut (US-0151), pour vérifier la répartition des Biomes : une forme par
 * Biome, dans sa couleur de la palette, et la légende avec la part de chacun. Un point marque
 * chaque emplacement où un Foyer pourrait encore naître (US-0152) ; une Case possédée est cerclée
 * d'Encre, avec le nom de son chef au survol (US-0153), et un Foyer marqué d'un hexagone plein
 * (US-0155).
 */
export function CarteCouronne({ couronne, noms, emplacements }: { couronne: CouronneEnBase; noms: Record<string, string>; emplacements: Coordonnees[] }) {
  const parBiome = new Map<string, { q: number; r: number }[]>();
  for (const c of couronne.cases) parBiome.set(c.biome, [...(parBiome.get(c.biome) ?? []), c]);
  const etendue = Math.max(...couronne.cases.map((c) => Math.abs(centre(c).x)), ...couronne.cases.map((c) => Math.abs(centre(c).y))) + 2;
  const biomes = [...parBiome.entries()].sort((a, b) => b[1].length - a[1].length);
  const possedees = couronne.cases.filter((c) => c.chef !== null);
  const foyers = couronne.cases.filter((c) => c.foyer);
  return (
    <div className={styles.carte}>
      <svg viewBox={`${-etendue} ${-etendue} ${2 * etendue} ${2 * etendue}`} role="img" aria-label={`La Couronne de ${couronne.monde}, ${couronne.cases.length} Cases`}>
        {biomes.map(([biome, cases]) => (
          <path key={biome} data-biome={biome} d={cases.map((c) => hexagone(c.q, c.r)).join("")} style={{ fill: couleur(biome) }} />
        ))}
        <g className={styles.possedees}>
          {possedees.map((c) => (
            <path key={`${c.q},${c.r}`} d={hexagone(c.q, c.r)}>
              <title>{c.chef}</title>
            </path>
          ))}
        </g>
        <path className={styles.foyers} d={foyers.map((c) => hexagone(c.q, c.r, 0.55)).join("")} />
        <g className={styles.emplacements}>
          {emplacements.map((e) => {
            const { x, y } = centre(e);
            return <circle key={`${e.q},${e.r}`} cx={x.toFixed(2)} cy={y.toFixed(2)} r="0.6" />;
          })}
        </g>
      </svg>
      <ul className={styles.legende}>
        <li>
          <span className={`${styles.pastille} ${styles.cerclee}`} aria-hidden="true" />
          Cases possédées
          <span className={styles.note}>{possedees.length}</span>
        </li>
        <li>
          <span className={`${styles.pastille} ${styles.foyer}`} aria-hidden="true" />
          Foyers
          <span className={styles.note}>{foyers.length}</span>
        </li>
        <li>
          <span className={`${styles.pastille} ${styles.point}`} aria-hidden="true" />
          Emplacements de Foyer
          {/* US-0159 : sous le seuil d'alerte, le nombre passe en couleur de danger. */}
          <span className={[styles.note, emplacements.length < ALERTE_PLACES_DE_FOYER && styles.alerte].filter(Boolean).join(" ")}>{emplacements.length}</span>
        </li>
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
