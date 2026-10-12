import { describe, expect, it } from "vitest";
import { pertesDuCombat } from "./combat";
import { combatsRejoues } from "./recit-du-combat";

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
      { rencontreId: 7, le: le(5), bete: { nom: "Pigeon biset", force: 15_000 }, escorte: 12_000, pertes: premieres },
      {
        rencontreId: 9,
        le: le(40),
        bete: { nom: "Poule", force: 20_000 },
        // Le second combat ne compte que les survivantes du premier.
        escorte: survivantes.reduce((n, e) => n + e.force * e.nombre, 0),
        pertes: pertesDuCombatNommees(20_000, survivantes),
      },
    ]);
  });

  it("une escorte perdue tout entière : le combat suivant se livre sans escorte, sans perte ; sans escorte dès le départ, aucune", () => {
    const [premier, second] = combatsRejoues(ESCORTE, [
      { rencontreId: 1, le: le(5), nom: "Pigeon biset", force: 1_000_000 },
      { rencontreId: 2, le: le(6), nom: "Poule", force: 50_000 },
    ]);
    expect(premier.pertes.reduce((n, p) => n + p.nombre, 0)).toBe(30);
    expect(second).toEqual({ rencontreId: 2, le: le(6), bete: { nom: "Poule", force: 50_000 }, escorte: 0, pertes: [] });
    expect(combatsRejoues([], [{ rencontreId: 3, le: le(7), nom: "Pigeon biset", force: 15_000 }])).toEqual([
      { rencontreId: 3, le: le(7), bete: { nom: "Pigeon biset", force: 15_000 }, escorte: 0, pertes: [] },
    ]);
  });

  it("aucun sans attaque", () => {
    expect(combatsRejoues(ESCORTE, [])).toEqual([]);
  });
});
