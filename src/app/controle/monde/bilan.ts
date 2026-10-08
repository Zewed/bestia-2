// US-0412 : ce que la page de contrôle dit d'un Monde, généré à la volée ou lu en base : la part de chaque
// Biome, ses lacs et ses rivières, ses emplacements de naissance libres et ses voisinages interdits.
import { emplacementsDeNaissance } from "@/monde/foyers";
import { voisines, type Coordonnees } from "@/monde/hex";

/** Une Case du Monde telle que la carte la montre ; en base, elle sait si un chef la possède et si elle porte un Foyer. */
export type CaseDeCarte = Coordonnees & {
  anneau: number;
  couronne: boolean;
  coeur: boolean;
  biome: string;
  variante: string | null;
  possedee?: boolean;
  foyer?: boolean;
};

export type Bilan = {
  /** Chaque Biome de terre, du plus étendu au moins étendu, avec sa part de la terre. */
  biomes: { biome: string; cases: number; part: number }[];
  /** Chaque eau (mer, côte, lac, rivière), de la plus étendue à la moins étendue. */
  eaux: { variante: string; cases: number }[];
  lacs: number;
  rivieres: number;
  foyers: Coordonnees[];
  emplacements: Coordonnees[];
  /** Chaque paire de Cases voisines dont les Biomes ne doivent jamais se toucher (US-0407), une fois. */
  interdits: string[];
};

const cle = (c: Coordonnees) => `${c.q},${c.r}`;

/** Combien de Cases porte chaque valeur, de la plus fréquente à la moins fréquente, puis dans l'ordre alphabétique. */
function compter(valeurs: string[]): [string, number][] {
  const comptes = new Map<string, number>();
  for (const v of valeurs) comptes.set(v, (comptes.get(v) ?? 0) + 1);
  return [...comptes.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

/**
 * US-0412 : le bilan d'un Monde. Un lac est une étendue de Cases de lac d'un seul tenant ; une rivière se
 * compte par sa source, la Case où elle naît : une seule voisine de rivière, et ni côte ni lac autour
 * (US-0411). Les emplacements de naissance sont ceux de US-0413, loin des Foyers déjà nés.
 */
export function bilanDuMonde(cases: CaseDeCarte[], voisinagesInterdits: [string, string][]): Bilan {
  const parCle = new Map(cases.map((c) => [cle(c), c]));
  const autour = (c: Coordonnees) => voisines(c).flatMap((v) => parCle.get(cle(v)) ?? []);
  const interdites = new Set(voisinagesInterdits.flatMap(([a, b]) => [`${a}|${b}`, `${b}|${a}`]));
  const terre = cases.filter((c) => c.biome !== "eau");
  const riviere = (c: CaseDeCarte) => c.variante === "riviere";

  const vus = new Set<string>();
  let lacs = 0;
  for (const c of cases) {
    if (c.variante !== "lac" || vus.has(cle(c))) continue;
    lacs++;
    vus.add(cle(c));
    for (const file = [c]; file.length > 0; ) {
      for (const v of autour(file.pop()!)) {
        if (v.variante === "lac" && !vus.has(cle(v))) {
          vus.add(cle(v));
          file.push(v);
        }
      }
    }
  }

  const foyers = cases.filter((c) => c.foyer).map(({ q, r }) => ({ q, r }));
  return {
    biomes: compter(terre.map((c) => c.biome)).map(([biome, n]) => ({ biome, cases: n, part: n / terre.length })),
    eaux: compter(cases.flatMap((c) => (c.biome === "eau" ? [c.variante ?? "eau"] : []))).map(([variante, n]) => ({ variante, cases: n })),
    lacs,
    rivieres: cases.filter((c) => riviere(c) && autour(c).filter(riviere).length === 1 && !autour(c).some((v) => v.variante === "cote" || v.variante === "lac")).length,
    foyers,
    emplacements: emplacementsDeNaissance(cases, foyers),
    interdits: cases.flatMap((c) =>
      autour(c)
        .filter((v) => (v.q > c.q || (v.q === c.q && v.r > c.r)) && interdites.has(`${c.biome}|${v.biome}`))
        .map((v) => `${cle(c)} ${c.biome} · ${cle(v)} ${v.biome}`),
    ),
  };
}
