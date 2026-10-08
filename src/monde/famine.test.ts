import { describe, expect, it } from "vitest";
import { departsPendantLAbsence, recitDeFinDeFamine, recitDesDeparts } from "./famine";

/** Une heure de Paris en octobre (UTC+2), comme le jeu l'enregistre, en temps universel. */
const aParis = (jour: number, heure: number, minute = 0) => new Date(Date.UTC(2026, 9, jour, heure - 2, minute));
const SORTIR = "Pour sortir de la Famine : produire plus de Nourriture ou nourrir moins de bouches.";

describe("le Récit des départs de Famine (US-0327)", () => {
  it("dit qui est parti, avec quel Métier et à quelle heure, et comment sortir de la Famine", () => {
    expect(recitDesDeparts([{ prenom: "Lumi", metier: "Bûcheron", partiLe: aParis(8, 14, 5) }])).toEqual({
      titre: "Lumi a quitté le Territoire",
      texte: `Faute de Nourriture, Lumi, Bûcheron, a quitté le Territoire le 8 octobre à 14:05.\n\n${SORTIR}`,
      survenuLe: aParis(8, 14, 5),
    });
  });

  it("dit « sans Métier » pour un Habitant qui n'en avait pas", () => {
    expect(recitDesDeparts([{ prenom: "Ines", metier: null, partiLe: aParis(8, 9) }]).texte).toBe(
      `Faute de Nourriture, Ines, sans Métier, a quitté le Territoire le 8 octobre à 09:00.\n\n${SORTIR}`,
    );
  });

  it("dit combien sont partis, puis chacun sur sa ligne, dans l'ordre de leurs départs ; daté du dernier", () => {
    const recit = recitDesDeparts([
      { prenom: "Ines", metier: null, partiLe: aParis(8, 23) },
      { prenom: "Joran", metier: "Chasseur", partiLe: aParis(9, 0) },
      { prenom: "Lumi", metier: "Bûcheron", partiLe: aParis(9, 1) },
    ]);
    expect(recit).toEqual({
      titre: "3 Habitants ont quitté le Territoire",
      texte: [
        "Faute de Nourriture, 3 Habitants ont quitté le Territoire :",
        "Ines, sans Métier, le 8 octobre à 23:00",
        "Joran, Chasseur, le 9 octobre à 00:00",
        "Lumi, Bûcheron, le 9 octobre à 01:00",
        "",
        SORTIR,
      ].join("\n"),
      survenuLe: aParis(9, 1),
    });
  });
});

describe("le Récit de la fin de la Famine (US-0328)", () => {
  it("dit que la Nourriture paie de nouveau l'Entretien, combien de temps la Famine a duré et combien d'Habitants sont partis", () => {
    expect(recitDeFinDeFamine(9, 9, aParis(9, 7))).toEqual({
      titre: "Fin de la Famine",
      texte: "La Nourriture paie de nouveau l'Entretien. La Famine a duré 9 h ; 9 Habitants ont quitté le Territoire.",
      survenuLe: aParis(9, 7),
    });
  });

  it("dit un seul départ, ou aucun", () => {
    expect(recitDeFinDeFamine(1.5, 1, aParis(9, 7)).texte).toBe("La Nourriture paie de nouveau l'Entretien. La Famine a duré 1 h 30 ; 1 Habitant a quitté le Territoire.");
    expect(recitDeFinDeFamine(0.5, 0, aParis(9, 7)).texte).toBe(
      "La Nourriture paie de nouveau l'Entretien. La Famine a duré 30 min ; aucun Habitant n'a quitté le Territoire.",
    );
  });

  it("dit sa durée arrondie à la minute en dessous : jamais plus longue qu'elle n'a été", () => {
    const duree = (heures: number) => recitDeFinDeFamine(heures, 0, aParis(9, 7)).texte.match(/a duré (.*) ;/)?.[1];
    expect(duree(0.01)).toBe("moins d'une minute");
    expect(duree(2 + 5 / 60 + 0.9 / 60)).toBe("2 h 05");
    expect(duree(26)).toBe("26 h");
    expect(duree(50.5)).toBe("2 j 2 h");
  });
});

describe("le bandeau des départs au retour (US-0327)", () => {
  it("dit combien d'Habitants sont partis pendant l'absence", () => {
    expect(departsPendantLAbsence(1)).toBe("1 Habitant est parti pendant votre absence");
    expect(departsPendantLAbsence(3)).toBe("3 Habitants sont partis pendant votre absence");
  });
});
