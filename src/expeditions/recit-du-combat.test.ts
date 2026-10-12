import { describe, expect, it } from "vitest";
import { pertesDuCombat } from "./combat";
import { combatsRejoues, combatsRetrouves } from "./recit-du-combat";

/** Une escorte de 10 Poules de force 1 000 et de 20 Souris grises de force 100 : 12 000 en tout. */
const ESCORTE = [
  { especeId: "poule", nom: "Poule", force: 1_000, nombre: 10 },
  { especeId: "souris", nom: "Souris grise", force: 100, nombre: 20 },
];
const le = (minute: number) => new Date(Date.UTC(2026, 9, 9, 12, minute));
/** Les pertes que prend le combat (US-0944) contre une Bête de force `bete`, avec les noms de leurs Espèces. */
const pertesDuCombatNommees = (bete: number, escorte: typeof ESCORTE) =>
  pertesDuCombat(bete, escorte).map((p) => ({ ...p, nom: escorte.find((e) => e.especeId === p.especeId)!.nom }));

describe("les combats d'une Expédition, rejoués pour son récit (US-0947)", () => {
  it("pour chacun, dans l'ordre reçu : l'instant, la Bête et sa force, la force de l'escorte d'alors et ses pertes, celles que le combat a prises", () => {
    const combats = combatsRejoues(ESCORTE, [
      { rencontreId: 7, le: le(5), nom: "Pigeon biset", force: 15_000 },
      { rencontreId: 9, le: le(40), nom: "Poule", force: 20_000 },
    ]);
    const premieres = pertesDuCombatNommees(15_000, ESCORTE);
    expect(premieres.length).toBeGreaterThan(0);
    const survivantes = ESCORTE.map((e) => ({ ...e, nombre: e.nombre - (premieres.find((p) => p.especeId === e.especeId)?.nombre ?? 0) }));
    expect(combats).toEqual([
      { rencontreId: 7, le: le(5), bete: { nom: "Pigeon biset", force: 15_000 }, escorte: 12_000, sansEscorte: false, pertes: premieres },
      {
        rencontreId: 9,
        le: le(40),
        bete: { nom: "Poule", force: 20_000 },
        // Le second combat ne compte que les survivantes du premier.
        escorte: survivantes.reduce((n, e) => n + e.force * e.nombre, 0),
        sansEscorte: false,
        pertes: pertesDuCombatNommees(20_000, survivantes),
      },
    ]);
  });

  it("une escorte perdue tout entière : le combat suivant se livre sans escorte, sans perte ; sans escorte dès le départ, aucune", () => {
    const [premier, second] = combatsRejoues(ESCORTE, [
      { rencontreId: 1, le: le(5), nom: "Pigeon biset", force: 1_000_000 },
      { rencontreId: 2, le: le(6), nom: "Poule", force: 50_000 },
    ]);
    expect(premier.pertes!.reduce((n, p) => n + p.nombre, 0)).toBe(30);
    expect(second).toEqual({ rencontreId: 2, le: le(6), bete: { nom: "Poule", force: 50_000 }, escorte: 0, sansEscorte: true, pertes: [] });
    expect(combatsRejoues([], [{ rencontreId: 3, le: le(7), nom: "Pigeon biset", force: 15_000 }])).toEqual([
      { rencontreId: 3, le: le(7), bete: { nom: "Pigeon biset", force: 15_000 }, escorte: 0, sansEscorte: true, pertes: [] },
    ]);
  });

  it("aucun sans attaque", () => {
    expect(combatsRejoues(ESCORTE, [])).toEqual([]);
  });

  it("une escorte de Bêtes sans arme, de force nulle, reste une escorte : elle perd tout", () => {
    const [combat] = combatsRejoues([{ especeId: "poule", nom: "Poule", force: 0, nombre: 3 }], [{ rencontreId: 4, le: le(8), nom: "Pigeon biset", force: 15_000 }]);
    expect(combat).toMatchObject({ escorte: 0, sansEscorte: false, pertes: [{ especeId: "poule", nom: "Poule", nombre: 3 }] });
  });
});

describe("les combats retrouvés : le rejeu ne fait foi que s'il retrouve les pertes retenues (US-0947)", () => {
  const attaques = [
    { rencontreId: 7, le: le(5), nom: "Pigeon biset", force: 15_000 },
    { rencontreId: 9, le: le(40), nom: "Poule", force: 20_000 },
  ];
  /** L'escorte de l'essai avec, pour chaque Espèce, les Bêtes perdues que le combat a retenues. */
  const avecPerdues = (perdues: Record<string, number>) => ESCORTE.map((e) => ({ ...e, perdues: perdues[e.especeId] ?? 0 }));
  const rejoues = combatsRejoues(ESCORTE, attaques);
  const enTout = (especeId: string) => rejoues.reduce((n, c) => n + (c.pertes!.find((p) => p.especeId === especeId)?.nombre ?? 0), 0);

  it("les retrouve : chaque combat a ses pertes ; et les pertes retenues, en tout, Espèce par Espèce", () => {
    expect(combatsRetrouves(avecPerdues({ poule: enTout("poule"), souris: enTout("souris") }), attaques)).toEqual({
      combats: rejoues,
      pertes: [
        { especeId: "poule", nom: "Poule", nombre: enTout("poule") },
        { especeId: "souris", nom: "Souris grise", nombre: enTout("souris") },
      ],
    });
  });

  it("ne les retrouve pas (la règle ou les Espèces ont changé depuis) : aucun combat n'a ses pertes, seules les retenues se disent", () => {
    const { combats, pertes } = combatsRetrouves(avecPerdues({ poule: 1, souris: 2 }), attaques);
    expect(combats).toEqual(rejoues.map((c) => ({ ...c, pertes: null })));
    expect(pertes).toEqual([
      { especeId: "poule", nom: "Poule", nombre: 1 },
      { especeId: "souris", nom: "Souris grise", nombre: 2 },
    ]);
  });
});
