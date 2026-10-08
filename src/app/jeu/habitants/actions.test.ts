import { afterEach, describe, expect, it, vi } from "vitest";

const garde = vi.hoisted(() => ({ exigerCompte: vi.fn() }));
vi.mock("@/comptes/garde", () => garde);
vi.mock("@/db", () => ({ getPool: () => ({}) }));
const habitants = vi.hoisted(() => ({
  enregistrerLeMetier: vi.fn(async () => true),
  ajouterUnHabitantAuMetier: vi.fn(async (): Promise<number | null> => 40),
  retirerUnHabitantDuMetier: vi.fn(async (): Promise<number | null> => 40),
  renvoyerLHabitant: vi.fn(async () => true),
}));
vi.mock("@/monde/habitants", () => habitants);
const cache = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/cache", () => cache);

import { ajouterAuMetier, donnerUnMetier, renvoyerUnHabitant, retirerDuMetier, retirerLeMetier } from "./actions";

describe("donner un Métier à un Habitant (US-0308)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    garde.exigerCompte.mockReset();
    habitants.enregistrerLeMetier.mockClear();
    cache.refresh.mockClear();
  });

  it("passe par la garde, puis donne le Métier à l'Habitant dans le Territoire du joueur, et relit la page", async () => {
    garde.exigerCompte.mockResolvedValue({ id: 7, email: "nom@exemple.fr", nomDeChef: "Ourse", territoireId: 12, recitLu: true });
    await donnerUnMetier(40, "bucheron");
    expect(garde.exigerCompte).toHaveBeenCalledWith("/jeu/habitants");
    expect(habitants.enregistrerLeMetier).toHaveBeenCalledExactlyOnceWith(expect.anything(), 12, 40, "bucheron");
    expect(cache.refresh).toHaveBeenCalledTimes(1);
  });

  it("relit la page même quand rien n'a changé (Habitant pas à ce joueur, Métier inconnu) : la page relue fait foi", async () => {
    garde.exigerCompte.mockResolvedValue({ territoireId: 12 });
    habitants.enregistrerLeMetier.mockResolvedValueOnce(false);
    await donnerUnMetier(41, "mineur");
    expect(cache.refresh).toHaveBeenCalledTimes(1);
  });

  it("s'arrête à la garde sans session : rien n'est donné", async () => {
    garde.exigerCompte.mockRejectedValue(Object.assign(new Error("NEXT_REDIRECT"), { digest: "NEXT_REDIRECT;replace;/connexion?suite=%2Fjeu%2Fhabitants;307;" }));
    await expect(donnerUnMetier(40, "bucheron")).rejects.toMatchObject({ digest: expect.stringContaining("/connexion") });
    expect(habitants.enregistrerLeMetier).not.toHaveBeenCalled();
  });

  it.each([[0], [-3], [1.5], [Number.NaN], [2 ** 31], ["40" as unknown as number]])("ignore un Habitant dont l'identifiant n'en est pas un : %s", async (id) => {
    garde.exigerCompte.mockResolvedValue({ territoireId: 12 });
    await donnerUnMetier(id, "bucheron");
    expect(habitants.enregistrerLeMetier).not.toHaveBeenCalled();
    expect(cache.refresh).not.toHaveBeenCalled();
  });

  it.each([[""], ["Bûcheron"], ["bucheron; drop table habitant"], ["b".repeat(65)], [null as unknown as string], [3 as unknown as string]])(
    "ignore un Métier dont l'identifiant n'en est pas un : %s",
    async (metier) => {
      garde.exigerCompte.mockResolvedValue({ territoireId: 12 });
      await donnerUnMetier(40, metier);
      expect(habitants.enregistrerLeMetier).not.toHaveBeenCalled();
      expect(cache.refresh).not.toHaveBeenCalled();
    },
  );

  it("ne fait rien pour un chef sans Territoire", async () => {
    garde.exigerCompte.mockResolvedValue({ territoireId: null });
    await donnerUnMetier(40, "bucheron");
    expect(habitants.enregistrerLeMetier).not.toHaveBeenCalled();
  });

  it("ne fait rien en production tant que l'entrée du jeu est fermée", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    await donnerUnMetier(40, "bucheron");
    expect(garde.exigerCompte).not.toHaveBeenCalled();
    expect(habitants.enregistrerLeMetier).not.toHaveBeenCalled();
  });
});

describe("retirer son Métier à un Habitant (US-0311)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    garde.exigerCompte.mockReset();
    habitants.enregistrerLeMetier.mockClear();
    cache.refresh.mockClear();
  });

  it("passe par la garde, puis remet sans Métier l'Habitant dans le Territoire du joueur, et relit la page", async () => {
    garde.exigerCompte.mockResolvedValue({ id: 7, email: "nom@exemple.fr", nomDeChef: "Ourse", territoireId: 12, recitLu: true });
    await retirerLeMetier(40);
    expect(garde.exigerCompte).toHaveBeenCalledWith("/jeu/habitants");
    expect(habitants.enregistrerLeMetier).toHaveBeenCalledExactlyOnceWith(expect.anything(), 12, 40, null);
    expect(cache.refresh).toHaveBeenCalledTimes(1);
  });

  it("relit la page même quand rien n'a changé (Habitant d'un autre) : la page relue fait foi", async () => {
    garde.exigerCompte.mockResolvedValue({ territoireId: 12 });
    habitants.enregistrerLeMetier.mockResolvedValueOnce(false);
    await retirerLeMetier(41);
    expect(cache.refresh).toHaveBeenCalledTimes(1);
  });

  it("s'arrête à la garde sans session : rien n'est retiré", async () => {
    garde.exigerCompte.mockRejectedValue(Object.assign(new Error("NEXT_REDIRECT"), { digest: "NEXT_REDIRECT;replace;/connexion?suite=%2Fjeu%2Fhabitants;307;" }));
    await expect(retirerLeMetier(40)).rejects.toMatchObject({ digest: expect.stringContaining("/connexion") });
    expect(habitants.enregistrerLeMetier).not.toHaveBeenCalled();
  });

  it.each([[0], [-3], [1.5], [Number.NaN], [2 ** 31], ["40" as unknown as number]])("ignore un Habitant dont l'identifiant n'en est pas un : %s", async (id) => {
    garde.exigerCompte.mockResolvedValue({ territoireId: 12 });
    await retirerLeMetier(id);
    expect(habitants.enregistrerLeMetier).not.toHaveBeenCalled();
    expect(cache.refresh).not.toHaveBeenCalled();
  });

  it("ne fait rien pour un chef sans Territoire, ni en production tant que l'entrée du jeu est fermée", async () => {
    garde.exigerCompte.mockResolvedValue({ territoireId: null });
    await retirerLeMetier(40);
    expect(habitants.enregistrerLeMetier).not.toHaveBeenCalled();
    garde.exigerCompte.mockClear();
    vi.stubEnv("VERCEL_ENV", "production");
    await retirerLeMetier(40);
    expect(garde.exigerCompte).not.toHaveBeenCalled();
    expect(habitants.enregistrerLeMetier).not.toHaveBeenCalled();
  });
});

describe("répartir les Habitants avec plus et moins (US-0312)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    garde.exigerCompte.mockReset();
    habitants.ajouterUnHabitantAuMetier.mockClear();
    habitants.retirerUnHabitantDuMetier.mockClear();
    cache.refresh.mockClear();
  });

  it("« + » passe par la garde, puis donne le Métier à un Habitant sans Métier du Territoire du joueur, choisi par la base, et relit la page", async () => {
    garde.exigerCompte.mockResolvedValue({ id: 7, email: "nom@exemple.fr", nomDeChef: "Ourse", territoireId: 12, recitLu: true });
    await ajouterAuMetier("bucheron");
    expect(garde.exigerCompte).toHaveBeenCalledWith("/jeu/habitants");
    expect(habitants.ajouterUnHabitantAuMetier).toHaveBeenCalledExactlyOnceWith(expect.anything(), 12, "bucheron");
    expect(cache.refresh).toHaveBeenCalledTimes(1);
  });

  it("« − » passe par la garde, puis remet sans Métier un Habitant de ce Métier du Territoire du joueur, choisi par la base, et relit la page", async () => {
    garde.exigerCompte.mockResolvedValue({ id: 7, email: "nom@exemple.fr", nomDeChef: "Ourse", territoireId: 12, recitLu: true });
    await retirerDuMetier("mineur");
    expect(garde.exigerCompte).toHaveBeenCalledWith("/jeu/habitants");
    expect(habitants.retirerUnHabitantDuMetier).toHaveBeenCalledExactlyOnceWith(expect.anything(), 12, "mineur");
    expect(cache.refresh).toHaveBeenCalledTimes(1);
  });

  it("relit la page même quand personne n'a changé (plus personne sans Métier, ou dans ce Métier) : la page relue fait foi", async () => {
    garde.exigerCompte.mockResolvedValue({ territoireId: 12 });
    habitants.ajouterUnHabitantAuMetier.mockResolvedValueOnce(null);
    habitants.retirerUnHabitantDuMetier.mockResolvedValueOnce(null);
    await ajouterAuMetier("bucheron");
    await retirerDuMetier("bucheron");
    expect(cache.refresh).toHaveBeenCalledTimes(2);
  });

  it("s'arrête à la garde sans session : personne ne change", async () => {
    garde.exigerCompte.mockRejectedValue(Object.assign(new Error("NEXT_REDIRECT"), { digest: "NEXT_REDIRECT;replace;/connexion?suite=%2Fjeu%2Fhabitants;307;" }));
    await expect(ajouterAuMetier("bucheron")).rejects.toMatchObject({ digest: expect.stringContaining("/connexion") });
    await expect(retirerDuMetier("bucheron")).rejects.toMatchObject({ digest: expect.stringContaining("/connexion") });
    expect(habitants.ajouterUnHabitantAuMetier).not.toHaveBeenCalled();
    expect(habitants.retirerUnHabitantDuMetier).not.toHaveBeenCalled();
  });

  it.each([[""], ["Bûcheron"], ["bucheron; drop table habitant"], ["b".repeat(65)], [null as unknown as string], [3 as unknown as string]])(
    "ignore un Métier dont l'identifiant n'en est pas un : %s",
    async (metier) => {
      garde.exigerCompte.mockResolvedValue({ territoireId: 12 });
      await ajouterAuMetier(metier);
      await retirerDuMetier(metier);
      expect(habitants.ajouterUnHabitantAuMetier).not.toHaveBeenCalled();
      expect(habitants.retirerUnHabitantDuMetier).not.toHaveBeenCalled();
      expect(cache.refresh).not.toHaveBeenCalled();
    },
  );

  it("ne fait rien pour un chef sans Territoire, ni en production tant que l'entrée du jeu est fermée", async () => {
    garde.exigerCompte.mockResolvedValue({ territoireId: null });
    await ajouterAuMetier("bucheron");
    await retirerDuMetier("bucheron");
    garde.exigerCompte.mockClear();
    vi.stubEnv("VERCEL_ENV", "production");
    await ajouterAuMetier("bucheron");
    await retirerDuMetier("bucheron");
    expect(garde.exigerCompte).not.toHaveBeenCalled();
    expect(habitants.ajouterUnHabitantAuMetier).not.toHaveBeenCalled();
    expect(habitants.retirerUnHabitantDuMetier).not.toHaveBeenCalled();
  });
});

describe("renvoyer un Habitant (US-0330)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    garde.exigerCompte.mockReset();
    habitants.renvoyerLHabitant.mockClear();
    cache.refresh.mockClear();
  });

  it("passe par la garde, puis renvoie l'Habitant du Territoire du joueur, à l'heure du jeu, et relit la page", async () => {
    garde.exigerCompte.mockResolvedValue({ id: 7, email: "nom@exemple.fr", nomDeChef: "Ourse", territoireId: 12, recitLu: true });
    const avant = Date.now();
    await renvoyerUnHabitant(40);
    expect(garde.exigerCompte).toHaveBeenCalledWith("/jeu/habitants");
    expect(habitants.renvoyerLHabitant).toHaveBeenCalledExactlyOnceWith(expect.anything(), 12, 40, expect.any(Date));
    const instant = (habitants.renvoyerLHabitant.mock.lastCall as unknown as [unknown, number, number, Date])[3].getTime();
    expect(instant).toBeGreaterThanOrEqual(avant);
    expect(instant).toBeLessThanOrEqual(Date.now());
    expect(cache.refresh).toHaveBeenCalledTimes(1);
  });

  it("relit la page même quand personne n'est parti (Habitant d'un autre, ou déjà parti) : la page relue fait foi", async () => {
    garde.exigerCompte.mockResolvedValue({ territoireId: 12 });
    habitants.renvoyerLHabitant.mockResolvedValueOnce(false);
    await renvoyerUnHabitant(41);
    expect(cache.refresh).toHaveBeenCalledTimes(1);
  });

  it("s'arrête à la garde sans session : personne ne part", async () => {
    garde.exigerCompte.mockRejectedValue(Object.assign(new Error("NEXT_REDIRECT"), { digest: "NEXT_REDIRECT;replace;/connexion?suite=%2Fjeu%2Fhabitants;307;" }));
    await expect(renvoyerUnHabitant(40)).rejects.toMatchObject({ digest: expect.stringContaining("/connexion") });
    expect(habitants.renvoyerLHabitant).not.toHaveBeenCalled();
  });

  it.each([[0], [-3], [1.5], [Number.NaN], [2 ** 31], ["40" as unknown as number]])("ignore un Habitant dont l'identifiant n'en est pas un : %s", async (id) => {
    garde.exigerCompte.mockResolvedValue({ territoireId: 12 });
    await renvoyerUnHabitant(id);
    expect(habitants.renvoyerLHabitant).not.toHaveBeenCalled();
    expect(cache.refresh).not.toHaveBeenCalled();
  });

  it("ne fait rien pour un chef sans Territoire, ni en production tant que l'entrée du jeu est fermée", async () => {
    garde.exigerCompte.mockResolvedValue({ territoireId: null });
    await renvoyerUnHabitant(40);
    expect(habitants.renvoyerLHabitant).not.toHaveBeenCalled();
    garde.exigerCompte.mockClear();
    vi.stubEnv("VERCEL_ENV", "production");
    await renvoyerUnHabitant(40);
    expect(garde.exigerCompte).not.toHaveBeenCalled();
    expect(habitants.renvoyerLHabitant).not.toHaveBeenCalled();
  });
});
