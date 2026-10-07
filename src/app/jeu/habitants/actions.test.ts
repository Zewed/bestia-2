import { afterEach, describe, expect, it, vi } from "vitest";

const garde = vi.hoisted(() => ({ exigerCompte: vi.fn() }));
vi.mock("@/comptes/garde", () => garde);
vi.mock("@/db", () => ({ getPool: () => ({}) }));
const habitants = vi.hoisted(() => ({ enregistrerLeMetier: vi.fn(async () => true) }));
vi.mock("@/monde/habitants", () => habitants);
const cache = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/cache", () => cache);

import { donnerUnMetier } from "./actions";

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
