import { describe, expect, it, vi } from "vitest";
import { lireVoisinagesInterdits } from "@/donnees/jeux";
import {
  CASES_ISOLEES_MAX,
  CHAINE_ALLONGEMENT_MIN,
  COEUR_SAUVAGE_RAYON,
  COURONNE_ANNEAUX,
  ECART_ENTRE_FOYERS,
  JOUEURS_PAR_MONDE,
  MER_MIN_CASES,
  MER_PART,
  MERS_MAX,
  MONDE_RAYON,
  PART_BIOME_MAX,
  PART_BIOME_MIN,
  REGION_BIOME_MIN_CASES,
} from "@/reglages";
import { BANDE_DE_CALCUL, graineDuMonde } from "./couronne";
import { GRAINE_MAX, genererLeMonde, lireUneGraine, type CaseGeneree } from "./generer";
import { casesDesAnneaux, CENTRE, centre, distance, eloignementDuCoeur, voisines, voisinesDansLeMonde, type Coordonnees } from "./hex";

const ESSAI = { rayon: MONDE_RAYON, anneaux: COURONNE_ANNEAUX, rayonCoeur: COEUR_SAUVAGE_RAYON, graine: 12345 };
/** Vingt graines quelconques, pour vérifier ce qui doit tenir pour tout Monde généré. */
const GRAINES = Array.from({ length: 20 }, (_, i) => 1 + i * 7919);
const cle = (c: { q: number; r: number }) => `${c.q},${c.r}`;
/** Les huit Biomes de terre (US-0406). */
const TERRE = ["prairie", "foret", "jungle", "savane", "desert", "montagne", "toundra", "banquise"];

/** Un Monde par graine, généré une seule fois pour tout le fichier : la suite reste rapide. */
const mondes = new Map<number, CaseGeneree[]>();
function mondeDe(graine: number): CaseGeneree[] {
  if (!mondes.has(graine)) mondes.set(graine, genererLeMonde({ ...ESSAI, graine }));
  return mondes.get(graine)!;
}

/** Les régions d'un seul tenant d'un Monde : des Cases voisines de même Biome, de proche en proche. */
function regionsDe(cases: CaseGeneree[]): CaseGeneree[][] {
  const parCle = new Map(cases.map((c) => [cle(c), c]));
  const vu = new Set<string>();
  const regions: CaseGeneree[][] = [];
  for (const c of cases) {
    if (vu.has(cle(c))) continue;
    const region = [c];
    vu.add(cle(c));
    for (let k = 0; k < region.length; k++) {
      for (const v of voisines(region[k])) {
        const voisine = parCle.get(cle(v));
        if (voisine && !vu.has(cle(v)) && voisine.biome === c.biome) {
          vu.add(cle(v));
          region.push(voisine);
        }
      }
    }
    regions.push(region);
  }
  return regions;
}

describe("générer un Monde à partir d'une graine (US-0401)", () => {
  const monde = mondeDe(ESSAI.graine);

  it("rend toutes les Cases du Monde, du Cœur sauvage au bord : 10 981 pour 60 anneaux, chacune unique", () => {
    expect(monde).toHaveLength(3 * 60 * 61 + 1);
    expect(monde).toHaveLength(10_981);
    expect(new Set(monde.map(cle)).size).toBe(monde.length);
    expect(Math.min(...monde.map((c) => c.anneau))).toBe(0);
    expect(Math.max(...monde.map((c) => c.anneau))).toBe(60);
  });

  it("donne toujours les mêmes Cases avec les mêmes Biomes à la même graine, Case par Case", () => {
    const encore = new Map(genererLeMonde(ESSAI).map((c) => [cle(c), c]));
    expect(encore.size).toBe(monde.length);
    for (const c of monde) expect(encore.get(cle(c))).toEqual(c);
  });

  it("donne un autre Monde à une autre graine", () => {
    const autre = new Map(mondeDe(54321).map((c) => [cle(c), c.biome]));
    const differentes = monde.filter((c) => autre.get(cle(c)) !== c.biome).length;
    expect(differentes / monde.length).toBeGreaterThan(0.3);
  });

  it("ne tire aucun hasard d'ailleurs que de la graine", () => {
    const hasard = vi.spyOn(Math, "random").mockImplementation(() => {
      throw new Error("Pas de hasard hors de la graine.");
    });
    try {
      expect(genererLeMonde(ESSAI)).toEqual(monde);
    } finally {
      hasard.mockRestore();
    }
  });

  it("refuse une Couronne plus large que la bande de calcul, comme la Couronne elle-même", () => {
    expect(() => genererLeMonde({ ...ESSAI, anneaux: BANDE_DE_CALCUL + 1 })).toThrow();
  });

  it("lit une graine : un nombre entier de 0 à 2³² − 1, rien d'autre", () => {
    expect(lireUneGraine("12345")).toBe(12345);
    expect(lireUneGraine("0")).toBe(0);
    expect(lireUneGraine(String(2 ** 32 - 1))).toBe(GRAINE_MAX);
    for (const texte of ["", "abc", "-1", "1.5", "1e3", String(2 ** 32)]) expect(() => lireUneGraine(texte)).toThrow(`Une graine est un nombre entier de 0 à 4294967295, pas « ${texte} ».`);
  });
});

describe("Cœur sauvage au milieu du Monde (US-0403)", () => {
  const cle = (c: { q: number; r: number }) => `${c.q},${c.r}`;

  it("fait savoir à chaque Case si elle appartient au Cœur sauvage : les 169 Cases à moins de 8 Cases du milieu, et seulement elles", () => {
    const cases = mondeDe(ESSAI.graine);
    expect(cases.filter((c) => c.coeur)).toHaveLength(169);
    for (const c of cases) expect(c.coeur).toBe(distance(c, CENTRE) < COEUR_SAUVAGE_RAYON);
    // Au milieu, le Cœur ne touche jamais la Couronne, au bord, la seule où naissent les chefs.
    expect(cases.filter((c) => c.coeur && c.couronne)).toEqual([]);
  });

  it.each([...GRAINES, graineDuMonde("Aube")])("mêle au moins quatre Biomes de terre en petites régions, sans eau (graine %i)", (graine) => {
    const coeur = mondeDe(graine).filter((c) => c.coeur);
    const parBiome = new Map<string, number>();
    for (const c of coeur) parBiome.set(c.biome, (parBiome.get(c.biome) ?? 0) + 1);
    expect(parBiome.size).toBeGreaterThanOrEqual(4);
    expect(parBiome.has("eau")).toBe(false);
    // Les régions du Cœur, comptées dans le Cœur seul : plusieurs, aucune ne le couvre à moitié, aucune n'est une tache.
    const biomeDe = new Map(coeur.map((c) => [cle(c), c.biome]));
    const vu = new Set<string>();
    const tailles: number[] = [];
    for (const c of coeur) {
      if (vu.has(cle(c))) continue;
      const region = [c];
      vu.add(cle(c));
      for (let k = 0; k < region.length; k++) {
        for (const v of voisines(region[k])) {
          if (!vu.has(cle(v)) && biomeDe.get(cle(v)) === c.biome) {
            vu.add(cle(v));
            region.push({ ...c, ...v });
          }
        }
      }
      tailles.push(region.length);
    }
    expect(tailles.length).toBeGreaterThanOrEqual(5);
    expect(Math.max(...tailles)).toBeLessThan(coeur.length / 2);
    expect(Math.min(...tailles)).toBeGreaterThanOrEqual(3);
  });

  it("tire le mélange du Cœur de la graine : la même graine donne le même Cœur, une autre un autre", () => {
    const coeur = (graine: number) => genererLeMonde({ ...ESSAI, graine }).filter((c) => c.coeur);
    expect(coeur(12345)).toEqual(coeur(12345));
    const autre = new Map(coeur(54321).map((c) => [cle(c), c.biome]));
    const differentes = coeur(12345).filter((c) => autre.get(cle(c)) !== c.biome).length;
    expect(differentes / 169).toBeGreaterThan(0.3);
  });
});

describe("Couronne sur le bord du Monde (US-0404)", () => {
  it("fait des Cases à moins de 6 Cases du bord la Couronne : comptées de proche en proche jusqu'au bord, et seulement elles", () => {
    expect(COURONNE_ANNEAUX).toBe(6);
    const bord = casesDesAnneaux(MONDE_RAYON, MONDE_RAYON);
    for (const c of mondeDe(ESSAI.graine)) {
      const jusquAuBord = Math.min(...bord.map((b) => distance(c, b)));
      expect(jusquAuBord).toBe(MONDE_RAYON - c.anneau);
      expect(c.couronne).toBe(jusquAuBord < COURONNE_ANNEAUX);
    }
  });

  it.each([...GRAINES, graineDuMonde("Aube")])(
    "fait savoir à chaque Case si elle est dans la Couronne, et y garde assez de terre pour 90 joueurs, à 4 Cases au moins l'un de l'autre (graine %i)",
    (graine) => {
      const cases = mondeDe(graine);
      for (const c of cases) expect(c.couronne).toBe(c.anneau > MONDE_RAYON - COURONNE_ANNEAUX);
      expect(cases.filter((c) => c.couronne)).toHaveLength(2070);
      // Des Foyers posés un à un sur la terre de la Couronne, sur la première Case assez loin des autres.
      const foyers: Coordonnees[] = [];
      for (const c of cases) if (c.couronne && c.biome !== "eau" && foyers.every((f) => distance(f, c) >= ECART_ENTRE_FOYERS)) foyers.push(c);
      expect(JOUEURS_PAR_MONDE).toBe(90);
      expect(foyers.length).toBeGreaterThanOrEqual(JOUEURS_PAR_MONDE);
    },
  );
});

describe("éloignement de chaque Case au Cœur sauvage (US-0405)", () => {
  const cle = (c: Coordonnees) => `${c.q},${c.r}`;
  const cases = mondeDe(ESSAI.graine);

  it("donne à chaque Case sa distance au Cœur sauvage, en Cases à franchir de proche en proche : 0 dans le Cœur, 53 sur le bord", () => {
    // Le Monde parcouru pas à pas depuis toutes les Cases du Cœur à la fois : le nombre de pas est l'éloignement.
    const pas = new Map(cases.filter((c) => c.coeur).map((c) => [cle(c), 0]));
    const file: Coordonnees[] = cases.filter((c) => c.coeur);
    for (let k = 0; k < file.length; k++) {
      for (const v of voisinesDansLeMonde(file[k], MONDE_RAYON)) {
        if (pas.has(cle(v))) continue;
        pas.set(cle(v), pas.get(cle(file[k]))! + 1);
        file.push(v);
      }
    }
    expect(pas.size).toBe(cases.length);
    for (const c of cases) expect(c.eloignement).toBe(pas.get(cle(c)));
    for (const c of cases) expect(c.eloignement).toBe(eloignementDuCoeur(c, COEUR_SAUVAGE_RAYON));
    expect(cases.filter((c) => c.eloignement === 0)).toEqual(cases.filter((c) => c.coeur));
    expect(cases.filter((c) => c.coeur)).toHaveLength(169);
    expect(Math.max(...cases.map((c) => c.eloignement))).toBe(MONDE_RAYON - COEUR_SAUVAGE_RAYON + 1);
  });

  it("donne toujours les mêmes distances à la même graine, Case par Case ; elles ne tiennent qu'à la forme du Monde", () => {
    const encore = new Map(genererLeMonde(ESSAI).map((c) => [cle(c), c.eloignement]));
    for (const c of cases) expect(encore.get(cle(c))).toBe(c.eloignement);
    const autre = new Map(mondeDe(54321).map((c) => [cle(c), c.eloignement]));
    for (const c of cases) expect(autre.get(cle(c))).toBe(c.eloignement);
  });
});

describe("régions de Biomes crédibles (US-0406)", () => {
  it("fixe les réglages des régions : 6 Cases au moins, 20 Cases isolées au plus, chaque Biome entre 4 % et 30 % de la terre", () => {
    expect(REGION_BIOME_MIN_CASES).toBe(6);
    expect(CASES_ISOLEES_MAX).toBe(20);
    expect([PART_BIOME_MIN, PART_BIOME_MAX]).toEqual([0.04, 0.3]);
  });

  it.each([...GRAINES, graineDuMonde("Aube")])("fait paraître les huit Biomes de terre, chacun entre 4 % et 30 % de la terre (graine %i)", (graine) => {
    const terre = mondeDe(graine).filter((c) => c.biome !== "eau");
    const parts = Object.fromEntries(TERRE.map((b) => [b, terre.filter((c) => c.biome === b).length / terre.length]));
    for (const biome of TERRE) {
      expect(parts[biome], biome).toBeGreaterThanOrEqual(PART_BIOME_MIN);
      expect(parts[biome], biome).toBeLessThanOrEqual(PART_BIOME_MAX);
    }
    expect(new Set(terre.map((c) => c.biome))).toEqual(new Set(TERRE));
    for (const c of terre) expect(c.variante).toBeNull();
  });

  it.each([...GRAINES, graineDuMonde("Aube")])("range chaque Biome en régions d'un seul tenant d'au moins 6 Cases, Couronne et Cœur compris, sans Case isolée (graine %i)", (graine) => {
    const cases = mondeDe(graine);
    const regions = regionsDe(cases).filter((r) => r[0].biome !== "eau");
    expect(Math.min(...regions.map((r) => r.length))).toBeGreaterThanOrEqual(REGION_BIOME_MIN_CASES);
    // Une Case isolée : aucune de ses voisines n'a son Biome.
    const biomeDe = new Map(cases.map((c) => [cle(c), c.biome]));
    const isolees = cases.filter((c) => voisinesDansLeMonde(c, MONDE_RAYON).every((v) => biomeDe.get(cle(v)) !== c.biome));
    expect(isolees.length).toBeLessThanOrEqual(CASES_ISOLEES_MAX);
    expect(isolees).toEqual([]);
  });

  it.each([12345, graineDuMonde("Aube")])("dessine de vraies régions et non un damier : deux voisines partagent presque toujours leur Biome (graine %i)", (graine) => {
    const cases = mondeDe(graine);
    const biomeDe = new Map(cases.map((c) => [cle(c), c.biome]));
    let paires = 0;
    let pareilles = 0;
    for (const c of cases) {
      for (const v of voisinesDansLeMonde(c, MONDE_RAYON)) {
        paires++;
        if (biomeDe.get(cle(v)) === c.biome) pareilles++;
      }
    }
    expect(pareilles / paires).toBeGreaterThan(0.8);
    // Des régions de toutes tailles, pas un Biome par Case ni un seul Biome partout.
    const tailles = regionsDe(cases).map((r) => r.length);
    expect(tailles.length).toBeGreaterThan(20);
    expect(Math.max(...tailles)).toBeLessThan(cases.length * PART_BIOME_MAX);
  });
});

describe("Biomes enchaînés de façon naturelle (US-0407)", () => {
  const paires = lireVoisinagesInterdits();
  const FROIDS = ["banquise", "toundra"];
  const TEMPERES = ["prairie", "foret"];
  const CHAUDS = ["desert", "savane", "jungle"];
  /** Les voisinages d'un Monde qui figurent dans une liste de paires interdites, chacun une fois. */
  const voisinagesInterdits = (cases: CaseGeneree[], interdites: [string, string][]) => {
    const biomeDe = new Map(cases.map((c) => [cle(c), c.biome]));
    return cases.flatMap((c) =>
      voisinesDansLeMonde(c, MONDE_RAYON)
        .filter((v) => interdites.some(([a, b]) => a === c.biome && b === biomeDe.get(cle(v))))
        .map((v) => `${cle(c)} ${c.biome} · ${cle(v)} ${biomeDe.get(cle(v))}`),
    );
  };

  /**
   * Le côté chaud d'un Monde, parmi les six côtés de l'hexagone : celui vers lequel les Biomes chauds
   * s'écartent le plus des froids. Rend sa direction et la position de chaque Case le long de l'axe, de
   * −1 au milieu du côté opposé à 1 au milieu du côté chaud.
   */
  function coteChaud(cases: CaseGeneree[]) {
    const axes = [0, 1, 2, 3, 4, 5].map((k) => {
      const angle = Math.PI / 6 + (k * Math.PI) / 3;
      const position = (c: Coordonnees) => (centre(c).x * Math.cos(angle) + centre(c).y * Math.sin(angle)) / (1.5 * MONDE_RAYON);
      const moyenne = (biomes: string[]) => {
        const choisies = cases.filter((c) => biomes.includes(c.biome) && !c.coeur);
        return choisies.reduce((s, c) => s + position(c), 0) / choisies.length;
      };
      return { k, position, moyenne, ecart: moyenne(CHAUDS) - moyenne(FROIDS) };
    });
    return axes.sort((a, b) => b.ecart - a.ecart)[0];
  }

  /** L'allongement d'une région : sa longueur (le plus long chemin de proche en proche qu'on y trouve) divisée par sa largeur (ses Cases divisées par sa longueur). */
  function allongement(region: CaseGeneree[]): number {
    const dans = new Set(region.map(cle));
    const plusLoin = (depart: Coordonnees) => {
      const pas = new Map([[cle(depart), 0]]);
      const file = [depart];
      for (let k = 0; k < file.length; k++) {
        for (const v of voisines(file[k])) {
          if (!dans.has(cle(v)) || pas.has(cle(v))) continue;
          pas.set(cle(v), pas.get(cle(file[k]))! + 1);
          file.push(v);
        }
      }
      return { bout: file[file.length - 1], longueur: pas.get(cle(file[file.length - 1]))! + 1 };
    };
    const { longueur } = plusLoin(plusLoin(region[0]).bout);
    return longueur / (region.length / longueur);
  }

  it.each([...GRAINES, graineDuMonde("Aube")])("n'a aucun des voisinages que les données du jeu interdisent, Cœur sauvage et Couronne compris (graine %i)", (graine) => {
    expect(paires.length).toBeGreaterThanOrEqual(6);
    expect(voisinagesInterdits(mondeDe(graine), paires)).toEqual([]);
  });

  it("suit la liste des données : un voisinage qu'on y ajoute disparaît du Monde", () => {
    const ajoutee: [string, string] = ["foret", "jungle"];
    expect(voisinagesInterdits(mondeDe(ESSAI.graine), [ajoutee]).length).toBeGreaterThan(0);
    const monde = genererLeMonde({ ...ESSAI, voisinagesInterdits: [...paires, ajoutee] });
    expect(voisinagesInterdits(monde, [...paires, ajoutee])).toEqual([]);
  });

  it.each([...GRAINES, graineDuMonde("Aube")])(
    "met les Biomes froids d'un côté du Monde et les chauds du côté opposé, prairie et forêt entre les deux (graine %i)",
    (graine) => {
      const cases = mondeDe(graine).filter((c) => !c.coeur);
      const { position, moyenne } = coteChaud(mondeDe(graine));
      const part = (biomes: string[], cote: (p: number) => boolean) => {
        const choisies = cases.filter((c) => biomes.includes(c.biome));
        return choisies.filter((c) => cote(position(c))).length / choisies.length;
      };
      // Hors du Cœur sauvage, qui mêle ses Biomes : presque tout le froid d'un côté, presque tout le chaud de l'autre.
      expect(part(FROIDS, (p) => p < 0)).toBeGreaterThan(0.9);
      expect(part(CHAUDS, (p) => p > 0)).toBeGreaterThan(0.9);
      expect(moyenne(["banquise"])).toBeLessThan(moyenne(["toundra"]));
      expect(moyenne(["toundra"])).toBeLessThan(moyenne(TEMPERES));
      expect(moyenne(TEMPERES)).toBeLessThan(moyenne(CHAUDS));
    },
  );

  it("tire de la graine le côté froid du Monde : il change d'un Monde à l'autre", () => {
    const cotes = new Set(GRAINES.map((graine) => coteChaud(mondeDe(graine)).k));
    expect(cotes.size).toBeGreaterThanOrEqual(3);
  });

  it.each([...GRAINES, graineDuMonde("Aube")])("dresse les montagnes en chaînes, au moins trois fois plus longues que larges, hors du Cœur sauvage (graine %i)", (graine) => {
    expect(CHAINE_ALLONGEMENT_MIN).toBe(3);
    const cases = mondeDe(graine);
    // Le Cœur sauvage mêle de petites régions rondes (US-0403) : les chaînes se comptent hors de lui.
    const chaines = regionsDe(cases.filter((c) => !c.coeur)).filter((r) => r[0].biome === "montagne");
    expect(chaines.length).toBeGreaterThanOrEqual(3);
    for (const chaine of chaines) {
      expect(chaine.length).toBeGreaterThanOrEqual(REGION_BIOME_MIN_CASES);
      expect(allongement(chaine), `${chaine.length} Cases depuis ${cle(chaine[0])}`).toBeGreaterThanOrEqual(CHAINE_ALLONGEMENT_MIN);
    }
    // Presque toutes les montagnes sont dans ces chaînes : celles du Cœur sont peu de chose.
    const enChaines = chaines.reduce((s, r) => s + r.length, 0);
    expect(enChaines / cases.filter((c) => c.biome === "montagne").length).toBeGreaterThan(0.9);
  });
});

describe("mer (US-0408)", () => {
  const mersDe = (cases: CaseGeneree[]) => regionsDe(cases.filter((c) => c.variante === "mer"));

  it("fixe les réglages de la mer : 15 % des Cases du Monde, en une à trois mers d'au moins 300 Cases", () => {
    expect([MER_PART, MERS_MAX, MER_MIN_CASES]).toEqual([0.15, 3, 300]);
  });

  it.each([...GRAINES, graineDuMonde("Aube")])(
    "couvre 15 % des Cases du Monde, à 2 points près, en une à trois grandes étendues d'un seul tenant, sans Case de mer isolée (graine %i)",
    (graine) => {
      const cases = mondeDe(graine);
      const mer = cases.filter((c) => c.variante === "mer");
      expect(Math.abs(mer.length / cases.length - MER_PART)).toBeLessThanOrEqual(0.02);
      // L'eau du Monde est toute de la mer, pour l'instant : les côtes, lacs et rivières viennent après.
      expect(cases.filter((c) => c.biome === "eau")).toEqual(mer);
      const mers = mersDe(cases);
      expect(mers.length).toBeGreaterThanOrEqual(1);
      expect(mers.length).toBeLessThanOrEqual(MERS_MAX);
      for (const etendue of mers) expect(etendue.length).toBeGreaterThanOrEqual(MER_MIN_CASES);
      const deMer = new Set(mer.map(cle));
      expect(mer.filter((c) => voisines(c).every((v) => !deMer.has(cle(v))))).toEqual([]);
    },
  );

  it.each([...GRAINES, graineDuMonde("Aube")])("n'entre jamais dans le Cœur sauvage (graine %i)", (graine) => {
    expect(mondeDe(graine).filter((c) => c.coeur && c.biome === "eau")).toEqual([]);
  });

  it("peut toucher la Couronne, et change d'un Monde à l'autre : une, deux ou trois mers selon la graine", () => {
    expect(GRAINES.some((graine) => mondeDe(graine).some((c) => c.couronne && c.variante === "mer"))).toBe(true);
    expect(new Set(GRAINES.map((graine) => mersDe(mondeDe(graine)).length))).toEqual(new Set([1, 2, 3]));
  });
});
