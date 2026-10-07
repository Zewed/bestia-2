import { afterEach, describe, expect, it, vi } from "vitest";

const garde = vi.hoisted(() => ({ exigerCompte: vi.fn() }));
vi.mock("@/comptes/garde", () => garde);
vi.mock("@/db", () => ({ getPool: () => ({}) }));
const voyageurs = vi.hoisted(() => ({ accueillirLeVoyageur: vi.fn(async () => true), refuserLeVoyageur: vi.fn(async () => true) }));
vi.mock("@/monde/voyageurs", () => voyageurs);
const cache = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/cache", () => cache);

import { accueillirUnVoyageur, refuserUnVoyageur } from "./actions-aux-portes";

/** Le chef connecté, tel que la garde le rend, sur le Territoire 12. */
const CONNECTE = { id: 7, email: "nom@exemple.fr", nomDeChef: "Ourse", territoireId: 12, recitLu: true };

afterEach(() => {
  vi.unstubAllEnvs();
  garde.exigerCompte.mockReset();
  voyageurs.accueillirLeVoyageur.mockClear();
  voyageurs.refuserLeVoyageur.mockClear();
  cache.refresh.mockClear();
});

describe("accueillir un Voyageur (US-0334)", () => {
  it("passe par la garde, puis accueille le Voyageur aux portes du Territoire du joueur, à l'heure du jeu, et relit la page", async () => {
    garde.exigerCompte.mockResolvedValue(CONNECTE);
    const avant = Date.now();
    await accueillirUnVoyageur(70);
    expect(garde.exigerCompte).toHaveBeenCalledWith("/jeu/habitants");
    expect(voyageurs.accueillirLeVoyageur).toHaveBeenCalledExactlyOnceWith(expect.anything(), 12, 70, expect.any(Date));
    const instant = (voyageurs.accueillirLeVoyageur.mock.lastCall as unknown as [unknown, number, number, Date])[3].getTime();
    expect(instant).toBeGreaterThanOrEqual(avant);
    expect(instant).toBeLessThanOrEqual(Date.now());
    expect(voyageurs.refuserLeVoyageur).not.toHaveBeenCalled();
    expect(cache.refresh).toHaveBeenCalledTimes(1);
  });
});

describe("refuser un Voyageur (US-0336)", () => {
  it("passe par la garde, puis fait repartir le Voyageur aux portes du Territoire du joueur, et relit la page", async () => {
    garde.exigerCompte.mockResolvedValue(CONNECTE);
    await refuserUnVoyageur(70);
    expect(garde.exigerCompte).toHaveBeenCalledWith("/jeu/habitants");
    expect(voyageurs.refuserLeVoyageur).toHaveBeenCalledExactlyOnceWith(expect.anything(), 12, 70);
    expect(voyageurs.accueillirLeVoyageur).not.toHaveBeenCalled();
    expect(cache.refresh).toHaveBeenCalledTimes(1);
  });
});

describe.each([
  { action: "accueillir", faire: accueillirUnVoyageur, ecrire: voyageurs.accueillirLeVoyageur },
  { action: "refuser", faire: refuserUnVoyageur, ecrire: voyageurs.refuserLeVoyageur },
])("$action un Voyageur, comme tout ce qui se fait aux portes (US-0334, US-0336)", ({ faire, ecrire }) => {
  it("relit la page même quand le Voyageur n'attend plus (accueilli, refusé ailleurs, ou pas à ce joueur) : la page relue fait foi", async () => {
    garde.exigerCompte.mockResolvedValue(CONNECTE);
    ecrire.mockResolvedValueOnce(false);
    await faire(71);
    expect(cache.refresh).toHaveBeenCalledTimes(1);
  });

  it("s'arrête à la garde sans session : le Voyageur attend toujours", async () => {
    garde.exigerCompte.mockRejectedValue(Object.assign(new Error("NEXT_REDIRECT"), { digest: "NEXT_REDIRECT;replace;/connexion?suite=%2Fjeu%2Fhabitants;307;" }));
    await expect(faire(70)).rejects.toMatchObject({ digest: expect.stringContaining("/connexion") });
    expect(ecrire).not.toHaveBeenCalled();
  });

  it.each([[0], [-3], [1.5], [Number.NaN], [2 ** 31], ["70" as unknown as number], [null as unknown as number]])(
    "ignore un Voyageur dont l'identifiant n'en est pas un : %s",
    async (id) => {
      garde.exigerCompte.mockResolvedValue(CONNECTE);
      await faire(id);
      expect(ecrire).not.toHaveBeenCalled();
      expect(cache.refresh).not.toHaveBeenCalled();
    },
  );

  it("ne fait rien pour un chef sans Territoire", async () => {
    garde.exigerCompte.mockResolvedValue({ ...CONNECTE, territoireId: null });
    await faire(70);
    expect(ecrire).not.toHaveBeenCalled();
  });

  it("ne fait rien en production tant que l'entrée du jeu est fermée", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    await faire(70);
    expect(garde.exigerCompte).not.toHaveBeenCalled();
    expect(ecrire).not.toHaveBeenCalled();
  });
});
