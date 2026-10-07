// Où un Foyer peut naître (US-0152) : la règle qu'utilisera la naissance d'un nouveau joueur.
import { ALERTE_PLACES_DE_FOYER, ECART_ENTRE_FOYERS, NAISSANCE_PARMI_LES_PLUS_PROCHES } from "@/reglages";
import { distance, type Coordonnees } from "./hex";

export type CaseCandidate = Coordonnees & { biome: string; possedee?: boolean; coeur?: boolean };

/**
 * Si un Foyer peut naître sur cette Case : en prairie seulement (donc jamais sur l'eau, ADR 0008),
 * sur une Case que personne ne possède, hors du Cœur sauvage (US-0403), et à au moins
 * ECART_ENTRE_FOYERS Cases de tout autre Foyer.
 */
export function peutAccueillirUnFoyer(c: CaseCandidate, foyers: Coordonnees[], ecart = ECART_ENTRE_FOYERS): boolean {
  return c.biome === "prairie" && !c.possedee && !c.coeur && foyers.every((f) => distance(f, c) >= ecart);
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

/**
 * La Case où naît un nouveau chef (US-0153), ou null si la Couronne est pleine. Le premier chef
 * d'un Monde naît sur une Case libre tirée au hasard ; les suivants, au hasard parmi les
 * emplacements libres les plus proches du dernier arrivé : les voisins arrivent en même temps.
 */
export function choisirCaseDeNaissance<C extends CaseCandidate>(
  cases: C[],
  foyers: Coordonnees[],
  dernier: Coordonnees | null,
  hasard: () => number = Math.random,
): C | null {
  const libres = cases.filter((c) => peutAccueillirUnFoyer(c, foyers));
  if (libres.length === 0) return null;
  const parmi = dernier
    ? [...libres].sort((a, b) => distance(a, dernier) - distance(b, dernier) || a.q - b.q || a.r - b.r).slice(0, NAISSANCE_PARMI_LES_PLUS_PROCHES)
    : libres;
  return parmi[Math.min(parmi.length - 1, Math.floor(hasard() * parmi.length))];
}

/**
 * L'alerte pour l'équipe (US-0159), ou null : un Monde plein, ou bientôt plein, sous
 * ALERTE_PLACES_DE_FOYER places restantes. Ouvrir un nouveau Monde reste une décision humaine.
 */
export function alerteDePlaces(monde: string, restantes: number): string | null {
  if (restantes === 0) return `Alerte : ${monde} est complet, aucun nouveau chef ne peut y naître.`;
  if (restantes < ALERTE_PLACES_DE_FOYER) return `Alerte : plus que ${restantes} place${restantes > 1 ? "s" : ""} de Foyer dans ${monde}.`;
  return null;
}

