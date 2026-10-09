import { describe, expect, it } from "vitest";
import { dureesReelles, type RetourARaconter, recitDeRetour } from "./recit-de-retour";

const MINUTE = 60_000;
/** Une heure de Paris en octobre (UTC+2), comme le jeu l'enregistre, en temps universel. */
const aParis = (jour: number, heure: number, minute = 0) => new Date(Date.UTC(2026, 9, jour, heure - 2, minute));

/** Le retour d'une Expédition partie vers une Forêt à 3 Cases du Foyer, 12 Cases levées, aucune Bête vue. */
const retour = (autre: Partial<RetourARaconter> = {}): RetourARaconter => ({
  destination: { biome: "Forêt", distance: 3 },
  durees: { aller: 60, sejour: 240, retour: 60 },
  casesLevees: 12,
  rencontres: 0,
  rentreeLe: aParis(9, 18, 5),
  ...autre,
});

describe("le récit de retour d'une Expédition (US-0917)", () => {
  it("donne la destination et son Biome, les durées de l'aller, du séjour et du retour, les Cases sorties du brouillard ; daté du retour", () => {
    expect(recitDeRetour(retour())).toEqual({
      titre: "Retour d'Expédition",
      texte: [
        "Destination : Forêt, à 3 Cases de votre Foyer.",
        "Aller 1 h, séjour 4 h, retour 1 h.",
        "12 Cases sont sorties du brouillard.",
        "Aucune Bête ne s'est montrée.",
      ].join("\n"),
      survenuLe: aParis(9, 18, 5),
    });
  });

  it("dit une destination à une Case, au singulier", () => {
    expect(recitDeRetour(retour({ destination: { biome: "Lac", distance: 1 } })).texte).toMatch(/^Destination : Lac, à 1 Case de votre Foyer\.\n/);
  });

  it("écrit les durées comme le reste du jeu : en minutes, en heures et minutes, puis en jours et heures", () => {
    const durees = (aller: number, sejour: number, retourMinutes: number) =>
      recitDeRetour(retour({ durees: { aller, sejour, retour: retourMinutes } })).texte.split("\n")[1];
    expect(durees(40, 60, 40)).toBe("Aller 40 min, séjour 1 h, retour 40 min.");
    expect(durees(80, 150, 80)).toBe("Aller 1 h 20, séjour 2 h 30, retour 1 h 20.");
    expect(durees(160, 26 * 60, 160)).toBe("Aller 2 h 40, séjour 1 j 2 h, retour 2 h 40.");
  });

  it("compte les Cases sorties du brouillard, une seule ou aucune", () => {
    const cases = (casesLevees: number) => recitDeRetour(retour({ casesLevees })).texte.split("\n")[2];
    expect(cases(1)).toBe("Une Case est sortie du brouillard.");
    expect(cases(0)).toBe("Aucune Case n'est sortie du brouillard.");
    expect(cases(31)).toBe("31 Cases sont sorties du brouillard.");
  });

  it("quand rien ne s'est montré, le dit en une phrase ; sinon, combien de Bêtes se sont montrées", () => {
    const betes = (rencontres: number) => recitDeRetour(retour({ rencontres })).texte.split("\n").at(-1);
    expect(betes(0)).toBe("Aucune Bête ne s'est montrée.");
    expect(betes(1)).toBe("Une Bête s'est montrée.");
    expect(betes(3)).toBe("3 Bêtes se sont montrées.");
  });

  it("n'est jamais vide, même sans Case levée ni Bête vue", () => {
    const { titre, texte } = recitDeRetour(retour({ casesLevees: 0, rencontres: 0 }));
    expect(titre).not.toBe("");
    expect(texte.split("\n")).toHaveLength(4);
  });
});

describe("les durées réelles d'une Expédition rentrée (US-0917)", () => {
  const partLe = aParis(9, 14);

  it("l'aller jusqu'à l'arrivée, le séjour choisi, le retour jusqu'à l'heure où elle est rentrée", () => {
    const horaires = { partLe, trajetMinutes: 40, sejourMinutes: 60 };
    expect(dureesReelles(horaires, new Date(partLe.getTime() + 140 * MINUTE))).toEqual({ aller: 40, sejour: 60, retour: 40 });
  });

  it("le retour se lit à l'heure où elle est vraiment rentrée, pas à celle que donnaient ses horaires", () => {
    const horaires = { partLe, trajetMinutes: 40, sejourMinutes: 60 };
    expect(dureesReelles(horaires, new Date(partLe.getTime() + 155 * MINUTE))?.retour).toBe(55);
  });

  it("aucune tant que son trajet n'est pas chiffré (US-0912)", () => {
    expect(dureesReelles({ partLe, trajetMinutes: null, sejourMinutes: 60 }, aParis(9, 18))).toBeNull();
  });
});

describe("le récit de retour d'une Expédition rappelée (US-0920)", () => {
  it("dit qu'elle a été rappelée, à l'aller, et quand, et qu'elle n'a pas séjourné", () => {
    const texte = recitDeRetour(retour({ durees: { aller: 50, sejour: 0, retour: 50 }, rappel: { le: aParis(9, 14, 50), pendant: "aller" } })).texte;
    expect(texte.split("\n").slice(0, 3)).toEqual([
      "Destination : Forêt, à 3 Cases de votre Foyer.",
      "Rappelée à l'aller le 9 octobre à 14:50.",
      "Aller 50 min, sans séjour, retour 50 min.",
    ]);
  });

  it("dit qu'elle a été rappelée pendant son séjour, et quand", () => {
    const texte = recitDeRetour(retour({ durees: { aller: 60, sejour: 30, retour: 60 }, rappel: { le: aParis(9, 15, 30), pendant: "sejour" } })).texte;
    expect(texte.split("\n").slice(1, 3)).toEqual(["Rappelée pendant le séjour le 9 octobre à 15:30.", "Aller 1 h, séjour 30 min, retour 1 h."]);
  });

  it("ne dit rien d'un rappel quand il n'y en a pas eu", () => {
    expect(recitDeRetour(retour({ rappel: null })).texte).not.toContain("Rappelée");
  });

  it("compte ses durées réelles : l'aller jusqu'au rappel, aucun séjour, et le retour", () => {
    const partLe = aParis(9, 14);
    const horaires = { partLe, trajetMinutes: 40, sejourMinutes: 60, rappeleeLe: new Date(partLe.getTime() + 25 * MINUTE) };
    expect(dureesReelles(horaires, new Date(partLe.getTime() + 50 * MINUTE))).toEqual({ aller: 25, sejour: 0, retour: 25 });
    const enSejour = { ...horaires, rappeleeLe: new Date(partLe.getTime() + 55 * MINUTE) };
    expect(dureesReelles(enSejour, new Date(partLe.getTime() + 95 * MINUTE))).toEqual({ aller: 40, sejour: 15, retour: 40 });
  });
});
