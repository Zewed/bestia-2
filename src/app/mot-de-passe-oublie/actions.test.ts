import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EMAIL_INVALIDE } from "@/comptes/email";
import { ETAT_OUBLI_INITIAL } from "./etat";

const reinitialisation = vi.hoisted(() => ({ preparerReinitialisation: vi.fn() }));
vi.mock("@/comptes/reinitialisation", () => reinitialisation);
vi.mock("@/db", () => ({ getPool: () => ({}) }));
const apres = vi.hoisted(() => ({ taches: [] as (() => unknown)[] }));
vi.mock("next/server", () => ({ after: (tache: () => unknown) => apres.taches.push(tache) }));
const courrier = vi.hoisted(() => ({ envoyerLienReinitialisation: vi.fn(async () => true) }));
vi.mock("@/emails/reinitialisation", () => courrier);

import { demanderLien } from "./actions";

const demande = (email: string) => {
  const donnees = new FormData();
  donnees.set("email", email);
  return demanderLien(ETAT_OUBLI_INITIAL, donnees);
};

describe("demande d'un lien pour changer de mot de passe", () => {
  beforeEach(() => {
    apres.taches = [];
    courrier.envoyerLienReinitialisation.mockClear();
    reinitialisation.preparerReinitialisation.mockReset();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("envoie le lien après la réponse quand l'adresse a un compte", async () => {
    reinitialisation.preparerReinitialisation.mockResolvedValue({ email: "nom@exemple.fr", jeton: "jeton123" });
    expect(await demande("Nom@Exemple.fr")).toEqual({ envoye: true, email: "Nom@Exemple.fr" });
    await apres.taches[0]();
    expect(courrier.envoyerLienReinitialisation).toHaveBeenCalledWith("nom@exemple.fr", "jeton123");
  });

  it("répond exactement la même chose quand il n'y a rien à envoyer (pas de compte, ou trop de demandes), sans rien envoyer", async () => {
    reinitialisation.preparerReinitialisation.mockResolvedValue(null);
    expect(await demande("Nom@Exemple.fr")).toEqual({ envoye: true, email: "Nom@Exemple.fr" });
    expect(apres.taches).toHaveLength(0);
  });

  it("refuse une adresse mal écrite, sans rien chercher", async () => {
    expect(await demande("nom@")).toEqual({ erreur: EMAIL_INVALIDE, email: "nom@" });
    expect(reinitialisation.preparerReinitialisation).not.toHaveBeenCalled();
  });

  it("ne fait rien en production tant que l'entrée du jeu est fermée", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect(await demande("nom@exemple.fr")).toEqual(ETAT_OUBLI_INITIAL);
    expect(reinitialisation.preparerReinitialisation).not.toHaveBeenCalled();
  });
});
