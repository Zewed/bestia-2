import { afterEach, describe, expect, it, vi } from "vitest";

const garde = vi.hoisted(() => ({ exigerCompteSansChef: vi.fn(async () => ({ id: 7, email: "nom@exemple.fr" })) }));
vi.mock("@/comptes/garde", () => garde);
const chefs = vi.hoisted(() => ({ nomDejaPris: vi.fn(), nomInterdit: vi.fn(async () => false), enregistrerNomDeChef: vi.fn() }));
vi.mock("@/chefs/chef", () => chefs);
vi.mock("@/db", () => ({ getPool: () => ({}) }));

import { NOM_DEJA_PRIS, NOM_NON_AUTORISE } from "@/chefs/nom";
import { validerNomDeChef, verifierNomLibre } from "./actions";

describe("vérifier qu'un nom de chef est libre (US-0135)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    chefs.nomDejaPris.mockReset();
    garde.exigerCompteSansChef.mockClear();
  });

  it("dit qu'un nom est déjà pris, nettoyé comme il sera enregistré", async () => {
    chefs.nomDejaPris.mockResolvedValue(true);
    expect(await verifierNomLibre("  Ours   Brun ")).toBe(NOM_DEJA_PRIS);
    expect(chefs.nomDejaPris).toHaveBeenCalledWith(expect.anything(), "Ours Brun");
    expect(garde.exigerCompteSansChef).toHaveBeenCalled();
  });

  it("refuse un nom interdit, sans dire s'il est pris (US-0138)", async () => {
    chefs.nomInterdit.mockResolvedValueOnce(true);
    expect(await verifierNomLibre("Connard42")).toBe(NOM_NON_AUTORISE);
    expect(chefs.nomDejaPris).not.toHaveBeenCalled();
  });

  it("ne dit rien d'un nom libre", async () => {
    chefs.nomDejaPris.mockResolvedValue(false);
    expect(await verifierNomLibre("Ourse")).toBeNull();
  });

  it("ne cherche pas un nom qui enfreint une autre règle", async () => {
    expect(await verifierNomLibre("Ou")).toBeNull();
    expect(await verifierNomLibre("Loup@")).toBeNull();
    expect(chefs.nomDejaPris).not.toHaveBeenCalled();
  });

  it("ne fait rien en production tant que l'entrée du jeu est fermée", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect(await verifierNomLibre("Ourse")).toBeNull();
    expect(garde.exigerCompteSansChef).not.toHaveBeenCalled();
  });
});

describe("valider le nom de chef (US-0139)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    chefs.enregistrerNomDeChef.mockReset();
  });

  const valider = (nom: string) => {
    const donnees = new FormData();
    donnees.set("nom", nom);
    return validerNomDeChef({ nom: "" }, donnees);
  };

  it("enregistre le nom nettoyé, puis mène au choix du Couple de départ (US-0141)", async () => {
    chefs.enregistrerNomDeChef.mockResolvedValue({ statut: "enregistre", nom: "Ours Brun" });
    await expect(valider("  Ours   Brun ")).rejects.toMatchObject({ digest: expect.stringContaining(";/jeu/couple-de-depart;") });
    expect(chefs.enregistrerNomDeChef).toHaveBeenCalledWith(expect.anything(), 7, "Ours Brun");
  });

  it("rend la raison d'un refus, pour le nom envoyé", async () => {
    chefs.enregistrerNomDeChef.mockResolvedValue({ statut: "refuse", erreur: NOM_NON_AUTORISE });
    expect(await valider("Ourse")).toEqual({ nom: "Ourse", erreur: NOM_NON_AUTORISE });
  });

  it("dit qu'un nom est pris, le message étant choisi par l'écran", async () => {
    chefs.enregistrerNomDeChef.mockResolvedValue({ statut: "pris" });
    expect(await valider("Ourse")).toEqual({ nom: "Ourse", pris: true });
  });

  it("ne fait rien en production tant que l'entrée du jeu est fermée", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect(await valider("Ourse")).toEqual({ nom: "" });
    expect(chefs.enregistrerNomDeChef).not.toHaveBeenCalled();
  });
});

