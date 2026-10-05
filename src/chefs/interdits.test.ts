import { describe, expect, it } from "vitest";
import { nomInterditPar, type MotInterdit } from "./interdits";

// Une petite liste d'essai : la vraie vit en base (migration 0021).
const MOTS: MotInterdit[] = [
  { mot: "connard", entier: false },
  { mot: "bestia", entier: false },
  { mot: "con", entier: true },
  { mot: "pute", entier: true },
  { mot: "admin", entier: true },
  { mot: "nazi", entier: true },
  { mot: "faggot", entier: false },
  { mot: "kkk", entier: false },
];

describe("noms de chef interdits (US-0138)", () => {
  it.each(["Connard", "Connard42", "Le Connard", "C-o-n-n-a-r-d", "C0nnard", "Conn4rd", "Connnnard", "CONNÂRD", "Bestia", "BestiaTeam", "Bestia Officiel", "B3st1a"])(
    "refuse « %s », où que soit le mot",
    (nom) => {
      expect(nomInterditPar(nom, MOTS)).toBe(true);
    },
  );

  it.each(["Con", "Le Con", "C-o-n", "C0n", "Pute", "Admin", "Nazi", "Grand-Admin"])("refuse « %s », un mot court seul", (nom) => {
    expect(nomInterditPar(nom, MOTS)).toBe(true);
  });

  it.each(["Conquête", "Faucon", "Dispute", "Badminton", "Nazim", "Ourse", "Loup42", "L'Ourse", "Élan"])(
    "laisse passer « %s », où un mot court n'est qu'un morceau d'un autre",
    (nom) => {
      expect(nomInterditPar(nom, MOTS)).toBe(false);
    },
  );

  it("attrape les lettres répétées davantage, jamais moins", () => {
    expect(nomInterditPar("Kkkk", MOTS)).toBe(true);
    expect(nomInterditPar("Faggggot", MOTS)).toBe(true);
    expect(nomInterditPar("Kaki", MOTS)).toBe(false);
    expect(nomInterditPar("Fagot", MOTS)).toBe(false);
    expect(nomInterditPar("Conard", MOTS)).toBe(false);
  });

  it("ne s'emballe pas sur un nom fait de chiffres ambigus", () => {
    expect(nomInterditPar("L111111111111111", MOTS)).toBe(false);
  });
});
