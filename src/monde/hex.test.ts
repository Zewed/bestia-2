import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { COEUR_SAUVAGE_RAYON, MONDE_RAYON } from "@/reglages";
import {
  anneau,
  casesDesAnneaux,
  centre,
  CENTRE,
  coordonneeValable,
  dansLeCoeur,
  dansLeMonde,
  distance,
  eloignementDuCoeur,
  SOMMETS_DE_CASE,
  tourDeLAnneau,
  voisines,
  voisinesDansLeMonde,
  type Coordonnees,
} from "./hex";

describe("géométrie des Cases", () => {
  it("mesure l'anneau d'une Case : sa distance au Cœur sauvage", () => {
    expect(anneau({ q: 0, r: 0 })).toBe(0);
    expect(anneau({ q: 3, r: -1 })).toBe(3);
    expect(anneau({ q: -2, r: -2 })).toBe(4);
    for (const c of casesDesAnneaux(0, 8)) expect(anneau(c)).toBe(distance(c, CENTRE));
  });

  it("compte six Cases par anneau et par pas d'anneau", () => {
    for (const k of [1, 2, 7, 60]) expect(casesDesAnneaux(k, k)).toHaveLength(6 * k);
    expect(casesDesAnneaux(0, 0)).toEqual([{ q: 0, r: 0 }]);
  });

  it("donne à chaque Case six voisines, à un pas d'elle", () => {
    const autour = voisines({ q: 2, r: -1 });
    expect(autour).toHaveLength(6);
    for (const v of autour) expect(anneau({ q: v.q - 2, r: v.r + 1 })).toBe(1);
  });

  it("n'accepte de coordonnée de Case qu'entière et que la base peut tenir (US-0428, US-0901)", () => {
    for (const n of [0, -5, 3, 2_147_483_647, -2_147_483_647]) expect(coordonneeValable(n)).toBe(true);
    for (const n of [2_147_483_648, -2_147_483_648, 3.5, Number.NaN, Number.POSITIVE_INFINITY]) expect(coordonneeValable(n)).toBe(false);
  });
});

describe("forme et voisinages du Monde (US-0402)", () => {
  const cle = (c: Coordonnees) => `${c.q},${c.r}`;

  it("compte la distance entre deux Cases en nombre de Cases à franchir, de proche en proche", () => {
    // Un petit Monde parcouru pas à pas depuis chacune de ses Cases : le nombre de pas est la distance.
    const monde = casesDesAnneaux(0, 5);
    for (const depart of monde) {
      const pas = new Map([[cle(depart), 0]]);
      const file = [depart];
      for (let k = 0; k < file.length; k++) {
        for (const v of voisinesDansLeMonde(file[k], 5)) {
          if (pas.has(cle(v))) continue;
          pas.set(cle(v), pas.get(cle(file[k]))! + 1);
          file.push(v);
        }
      }
      expect(pas.size).toBe(monde.length);
      for (const arrivee of monde) expect(distance(depart, arrivee)).toBe(pas.get(cle(arrivee)));
    }
    expect(distance({ q: 3, r: -4 }, { q: -2, r: 1 })).toBe(5);
    expect(distance({ q: -2, r: 1 }, { q: 3, r: -4 })).toBe(5);
  });

  it(`a la forme d'un grand hexagone de ${MONDE_RAYON} Cases de rayon : six coins et six bords droits de ${MONDE_RAYON + 1} Cases`, () => {
    expect(MONDE_RAYON).toBe(60);
    const bord = casesDesAnneaux(MONDE_RAYON, MONDE_RAYON);
    const coins = bord.filter((c) => voisinesDansLeMonde(c, MONDE_RAYON).length === 3);
    expect(new Set(coins.map(cle))).toEqual(new Set(["60,0", "60,-60", "0,-60", "-60,0", "-60,60", "0,60"]));
    // Chaque bord va d'un coin au suivant en ligne droite : une coordonnée y reste fixée à ±60.
    for (const [fixe, valeur] of [["q", 60], ["r", -60], ["q", -60], ["r", 60]] as const) {
      expect(bord.filter((c) => c[fixe] === valeur)).toHaveLength(MONDE_RAYON + 1);
    }
    expect(bord.filter((c) => c.q + c.r === 60)).toHaveLength(MONDE_RAYON + 1);
    expect(bord.filter((c) => c.q + c.r === -60)).toHaveLength(MONDE_RAYON + 1);
    expect(dansLeMonde({ q: 60, r: 0 }, MONDE_RAYON)).toBe(true);
    expect(dansLeMonde({ q: 61, r: 0 }, MONDE_RAYON)).toBe(false);
    expect(dansLeMonde({ q: 40, r: 40 }, MONDE_RAYON)).toBe(false);
  });

  it("donne à chaque Case ses six voisines dans le Monde ; au bord, quatre, et trois aux six coins", () => {
    const monde = casesDesAnneaux(0, MONDE_RAYON);
    const parNombre = new Map<number, number>();
    for (const c of monde) {
      const autour = voisinesDansLeMonde(c, MONDE_RAYON);
      parNombre.set(autour.length, (parNombre.get(autour.length) ?? 0) + 1);
      for (const v of autour) {
        expect(distance(c, v)).toBe(1);
        expect(voisinesDansLeMonde(v, MONDE_RAYON).map(cle)).toContain(cle(c));
      }
      if (anneau(c) < MONDE_RAYON) expect(autour).toHaveLength(6);
    }
    expect(Object.fromEntries(parNombre)).toEqual({ 6: monde.length - 6 * MONDE_RAYON, 4: 6 * (MONDE_RAYON - 1), 3: 6 });
  });

  it("est la seule façon de compter une distance ou un anneau dans le code du jeu", () => {
    // Le calcul de distance hexagonale (le plus grand des trois écarts, ou leur demi-somme) n'apparaît que
    // dans hex.ts, et dans la contrainte case_anneau_exact de la base, qui vérifie la même formule.
    const permis = new Set([join("src", "monde", "hex.ts"), join("src", "db", "schema.ts")]);
    const formule = /Math\.max\(\s*Math\.abs|greatest\(\s*abs\(|abs\([^()]*\)\s*\+\s*(Math\.)?abs\(/i;
    const fichiers = (dossier: string): string[] =>
      readdirSync(dossier, { withFileTypes: true }).flatMap((e) => {
        const chemin = join(dossier, e.name);
        if (e.isDirectory()) return fichiers(chemin);
        return /\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name) ? [chemin] : [];
      });
    const autres = [...fichiers("src"), ...fichiers("scripts")].filter(
      (f) => !permis.has(f) && formule.test(readFileSync(f, "utf8")),
    );
    expect(autres).toEqual([]);
  });
});

describe("Cœur sauvage au milieu du Monde (US-0403)", () => {
  it(`fait des Cases à moins de ${COEUR_SAUVAGE_RAYON} Cases du milieu le Cœur sauvage : les anneaux 0 à 7, 169 Cases`, () => {
    expect(COEUR_SAUVAGE_RAYON).toBe(8);
    const monde = casesDesAnneaux(0, MONDE_RAYON);
    expect(monde.filter((c) => dansLeCoeur(c, COEUR_SAUVAGE_RAYON))).toHaveLength(3 * 7 * 8 + 1);
    for (const c of monde) expect(dansLeCoeur(c, COEUR_SAUVAGE_RAYON)).toBe(distance(c, CENTRE) < 8);
    expect(dansLeCoeur({ q: 7, r: -7 }, COEUR_SAUVAGE_RAYON)).toBe(true);
    expect(dansLeCoeur({ q: 8, r: -7 }, COEUR_SAUVAGE_RAYON)).toBe(false);
  });
});

describe("éloignement au Cœur sauvage (US-0405)", () => {
  it("compte la distance d'une Case au Cœur sauvage : jusqu'à la Case du Cœur la plus proche, 0 pour les siennes", () => {
    const monde = casesDesAnneaux(0, 14);
    for (const rayonCoeur of [1, 2, 3, 5, COEUR_SAUVAGE_RAYON]) {
      const coeur = monde.filter((c) => dansLeCoeur(c, rayonCoeur));
      for (const c of monde) {
        expect(eloignementDuCoeur(c, rayonCoeur)).toBe(Math.min(...coeur.map((k) => distance(c, k))));
        expect(eloignementDuCoeur(c, rayonCoeur) === 0).toBe(dansLeCoeur(c, rayonCoeur));
      }
    }
    expect(eloignementDuCoeur(CENTRE, COEUR_SAUVAGE_RAYON)).toBe(0);
    expect(eloignementDuCoeur({ q: 8, r: -8 }, COEUR_SAUVAGE_RAYON)).toBe(1);
    expect(eloignementDuCoeur({ q: 0, r: -60 }, COEUR_SAUVAGE_RAYON)).toBe(53);
  });
});

describe("tour d'un anneau (US-0413)", () => {
  const cle = (c: Coordonnees) => `${c.q},${c.r}`;

  it.each([1, 2, 7, 57])("fait le tour de l'anneau %i de proche en proche : toutes ses Cases, une fois chacune, chacune voisine de la suivante", (k) => {
    const tour = tourDeLAnneau(k);
    expect(new Set(tour.map(cle))).toEqual(new Set(casesDesAnneaux(k, k).map(cle)));
    expect(tour).toHaveLength(6 * k);
    for (const [i, c] of tour.entries()) expect(distance(c, tour[(i + 1) % tour.length]), cle(c)).toBe(1);
  });

  it("réduit l'anneau 0 au centre du Monde", () => {
    expect(tourDeLAnneau(0)).toEqual([CENTRE]);
  });
});

describe("dessin d'une Case (US-0417)", () => {
  it("pose les six sommets d'une Case de rayon 1 à un pas de son centre, pointe en haut, dans le sens des aiguilles d'une montre", () => {
    expect(SOMMETS_DE_CASE).toHaveLength(6);
    for (const s of SOMMETS_DE_CASE) expect(Math.hypot(s.x, s.y)).toBeCloseTo(1, 12);
    expect(SOMMETS_DE_CASE[0]).toEqual({ x: 0, y: -1 });
    expect(SOMMETS_DE_CASE[1].x).toBeGreaterThan(0);
    expect(SOMMETS_DE_CASE[3]).toEqual({ x: 0, y: 1 });
    // Sa largeur, d'un côté plat à l'autre : √3, l'écart entre les centres de deux voisines d'une même ligne.
    const xs = SOMMETS_DE_CASE.map((s) => s.x);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(centre({ q: 1, r: 0 }).x, 12);
  });

  it("fait se toucher deux Cases voisines par un côté entier : deux sommets en commun, et rien ne se chevauche", () => {
    const sommetsDe = (c: Coordonnees) => SOMMETS_DE_CASE.map((s) => `${(centre(c).x + s.x).toFixed(9)},${(centre(c).y + s.y).toFixed(9)}`);
    const ici = new Set(sommetsDe({ q: 2, r: -1 }));
    for (const v of voisines({ q: 2, r: -1 })) expect(sommetsDe(v).filter((s) => ici.has(s))).toHaveLength(2);
    expect(sommetsDe({ q: 4, r: -1 }).filter((s) => ici.has(s))).toHaveLength(0);
  });
});
