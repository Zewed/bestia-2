import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const confirmation = vi.hoisted(() => ({ nouveauLienDepuis: vi.fn() }));
vi.mock("@/comptes/confirmation", () => confirmation);
vi.mock("@/db", () => ({ getPool: () => ({}) }));
const apres = vi.hoisted(() => ({ taches: [] as (() => unknown)[] }));
vi.mock("next/server", () => ({ after: (tache: () => unknown) => apres.taches.push(tache) }));
const courrier = vi.hoisted(() => ({ envoyerLienConfirmation: vi.fn(async () => true) }));
vi.mock("@/emails/confirmation", () => courrier);

import { demanderNouveauLien } from "./actions";

describe("demande d'un nouveau lien de confirmation", () => {
  beforeEach(() => {
    apres.taches = [];
    courrier.envoyerLienConfirmation.mockClear();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("envoie le nouveau lien après la réponse", async () => {
    confirmation.nouveauLienDepuis.mockResolvedValue({ email: "nom@exemple.fr", jeton: "nouveau" });
    await demanderNouveauLien("ancien");
    expect(confirmation.nouveauLienDepuis).toHaveBeenCalledWith({}, "ancien");
    await apres.taches[0]();
    expect(courrier.envoyerLienConfirmation).toHaveBeenCalledWith("nom@exemple.fr", "nouveau");
  });

  it("n'envoie rien quand il n'y a rien à envoyer, sans le dire", async () => {
    confirmation.nouveauLienDepuis.mockResolvedValue(null);
    await expect(demanderNouveauLien("ancien")).resolves.toBeUndefined();
    expect(apres.taches).toHaveLength(0);
  });

  it("ne fait rien en production tant que l'entrée du jeu est fermée", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    confirmation.nouveauLienDepuis.mockClear();
    await demanderNouveauLien("ancien");
    expect(confirmation.nouveauLienDepuis).not.toHaveBeenCalled();
  });
});
