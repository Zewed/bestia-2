// Où un Foyer peut naître (US-0152) : la règle qu'utilisera la naissance d'un nouveau joueur.
import { ECART_ENTRE_FOYERS } from "@/reglages";
import { distance, type Coordonnees } from "./hex";

export type CaseCandidate = Coordonnees & { biome: string; possedee?: boolean };

/**
 * Si un Foyer peut naître sur cette Case : en prairie seulement (donc jamais sur l'eau, ADR 0008),
 * sur une Case que personne ne possède, et à au moins ECART_ENTRE_FOYERS Cases de tout autre Foyer.
 */
export function peutAccueillirUnFoyer(c: CaseCandidate, foyers: Coordonnees[], ecart = ECART_ENTRE_FOYERS): boolean {
  return c.biome === "prairie" && !c.possedee && foyers.every((f) => distance(f, c) >= ecart);
}

/**
 * Une estimation de la place qui reste : les emplacements où naîtraient les prochains Foyers, si
 * on les posait un à un, dans l'ordre des Cases, sur la première Case qui le permet. Pour la page
 * de contrôle : la naissance (US-0153) choisira la Case à sa façon.
 */
export function emplacementsDeFoyers(cases: CaseCandidate[], foyers: Coordonnees[], ecart = ECART_ENTRE_FOYERS): Coordonnees[] {
  const poses = [...foyers];
  const emplacements: Coordonnees[] = [];
  for (const c of cases) {
    if (!peutAccueillirUnFoyer(c, poses, ecart)) continue;
    poses.push(c);
    emplacements.push({ q: c.q, r: c.r });
  }
  return emplacements;
}
