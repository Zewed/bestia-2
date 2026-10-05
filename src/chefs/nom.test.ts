import { describe, expect, it } from "vitest";
import { NOM_DE_CHEF_MAX, NOM_DE_CHEF_MIN } from "@/reglages";
import {
  CARACTERE_INVISIBLE,
  caractereRefuse,
  cleDuNom,
  COMMENCER_PAR_UNE_LETTRE,
  couperNom,
  DEUX_SIGNES_A_LA_SUITE,
  longueurDuNom,
  NOM_TROP_COURT,
  NOM_TROP_LONG,
  nettoyerNom,
  nettoyerSaisie,
  preparerNom,
  verifierCaracteresDuNom,
  verifierLongueurDuNom,
  verifierNomDeChef,
} from "./nom";

describe("longueur du nom de chef (US-0132)", () => {
  it("va de 3 à 16 caractères", () => {
    expect([NOM_DE_CHEF_MIN, NOM_DE_CHEF_MAX]).toEqual([3, 16]);
    expect(NOM_TROP_COURT).toBe("3 caractères minimum");
    expect(NOM_TROP_LONG).toBe("16 caractères maximum");
  });

  it("compte les caractères tels qu'on les voit, sans les espaces autour", () => {
    expect(longueurDuNom("Élan")).toBe(4);
    expect(longueurDuNom("E\u0301lan")).toBe(4); // le même « É », écrit en deux morceaux
    expect(longueurDuNom("  Ourse  ")).toBe(5);
    expect(longueurDuNom("Ours brun")).toBe(9);
  });

  it.each([
    ["", NOM_TROP_COURT],
    ["Ou", NOM_TROP_COURT],
    ["  Ou  ", NOM_TROP_COURT],
    ["Élu", null],
    ["Seize caractères", null],
    ["Dix-sept lettres!", NOM_TROP_LONG],
  ])("« %s » : %s", (nom, message) => {
    expect(verifierLongueurDuNom(nom)).toBe(message);
  });

  it("coupe un collage trop long à 16 caractères, sans casser un accent", () => {
    expect(couperNom("Le grand ours des montagnes")).toBe("Le grand ours de");
    expect(longueurDuNom(couperNom("E\u0301".repeat(20)))).toBe(16);
    expect(couperNom("E\u0301".repeat(20))).toBe("E\u0301".repeat(16));
    expect(couperNom("  Ourse")).toBe("  Ourse");
  });
});

describe("caractères du nom de chef (US-0133)", () => {
  it.each(["Ourse", "Élan", "Ça Va", "Cœur De Loup", "Ægir", "Straße", "Ștefan", "Jean-Loup", "L'Ourse", "Loup42", "Ours  Brun", "ÿÉçŒ"])(
    "accepte « %s »",
    (nom) => {
      expect(verifierCaracteresDuNom(nom)).toBeNull();
    },
  );

  it.each([
    ["Loup🐺", caractereRefuse("🐺")],
    ["Loup👨\u200D👩\u200D👧", caractereRefuse("👨\u200D👩\u200D👧")],
    ["Loup@", caractereRefuse("@")],
    ["Ours_Brun", caractereRefuse("_")],
    ["Loup.", caractereRefuse(".")],
    ["Оurse", caractereRefuse("О")], // un « О » cyrillique
    ["Ourſe", caractereRefuse("ſ")],
    ["Ｌoup", caractereRefuse("Ｌ")],
    ["Lo\u200Bup", CARACTERE_INVISIBLE],
    ["Lo\u202Eup", CARACTERE_INVISIBLE],
    ["Lou\u3164p", CARACTERE_INVISIBLE],
    ["Lo\u0301\u0302\u0303up", caractereRefuse("ó\u0302\u0303")], // des accents empilés sur une lettre
    ["1234", COMMENCER_PAR_UNE_LETTRE],
    ["-Loup", COMMENCER_PAR_UNE_LETTRE],
    ["'Ours", COMMENCER_PAR_UNE_LETTRE],
    ["Loup--Gris", DEUX_SIGNES_A_LA_SUITE],
    ["L''Ourse", DEUX_SIGNES_A_LA_SUITE],
    ["L' Ourse", DEUX_SIGNES_A_LA_SUITE],
    ["Loup -Gris", DEUX_SIGNES_A_LA_SUITE],
  ])("refuse « %s »", (nom, message) => {
    expect(verifierCaracteresDuNom(nom)).toBe(message);
  });

  it("nomme le caractère fautif en peu de mots", () => {
    expect(caractereRefuse("@")).toBe("« @ » n'est pas autorisé");
    expect(CARACTERE_INVISIBLE).toBe("Caractère invisible non autorisé");
  });

  it("redresse les apostrophes courbes et les espaces spéciaux, et soude les accents", () => {
    expect(preparerNom("L\u2019Ourse")).toBe("L'Ourse");
    expect(preparerNom("Jean\u2011Loup")).toBe("Jean-Loup");
    expect(preparerNom("Ours\u00A0Brun")).toBe("Ours Brun");
    expect(preparerNom("E\u0301lan")).toBe("Élan");
    expect(verifierCaracteresDuNom("L\u2019Ourse")).toBeNull();
  });

  it("vérifie les caractères avant la longueur, comme le joueur les rencontre", () => {
    expect(verifierNomDeChef("@@")).toBe(caractereRefuse("@"));
    expect(verifierNomDeChef("Ou")).toBe(NOM_TROP_COURT);
    expect(verifierNomDeChef("Ourse")).toBeNull();
  });
});

describe("espaces du nom de chef (US-0134)", () => {
  it("n'écrit ni espace en tête ni deux espaces de suite, et garde l'espace de fin pendant la frappe", () => {
    expect(nettoyerSaisie("  Ours   Brun  ")).toBe("Ours Brun ");
    expect(nettoyerSaisie("Ours ")).toBe("Ours ");
    expect(nettoyerSaisie("Ours\u00A0\u00A0Brun")).toBe("Ours Brun");
  });

  it("enregistre le nom sans espace au début ni à la fin", () => {
    expect(nettoyerNom("  Ours   Brun  ")).toBe("Ours Brun");
    expect(nettoyerNom("L\u2019Ourse ")).toBe("L'Ourse");
  });

  it("réduit un nom fait d'espaces à rien, refusé comme trop court", () => {
    expect(nettoyerNom("     ")).toBe("");
    expect(verifierNomDeChef(nettoyerNom("     "))).toBe(NOM_TROP_COURT);
  });
});

describe("comparaison des noms de chef (US-0135)", () => {
  it.each([
    ["Élan", "Elan", "élan", "ÉLAN", " E-lan "],
    ["Cœur", "Coeur", "COEUR"],
    ["Straße", "Strasse"],
    ["Ægir", "Aegir"],
    ["Łukasz", "Lukasz"],
    ["Ours Brun", "Ours-Brun", "OursBrun", "ours brun"],
    ["L'Ourse", "L\u2019Ourse", "Lourse"],
  ])("tient « %s » pour le même nom que les autres", (...noms) => {
    expect(new Set(noms.map(cleDuNom)).size).toBe(1);
  });

  it("garde les chiffres et distingue les vrais noms différents", () => {
    expect(cleDuNom("Loup42")).toBe("loup42");
    expect(cleDuNom("Loup")).not.toBe(cleDuNom("Loupe"));
  });
});

