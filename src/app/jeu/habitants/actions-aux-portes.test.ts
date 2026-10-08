import { afterEach, describe, expect, it, vi } from "vitest";

const garde = vi.hoisted(() => ({ exigerCompte: vi.fn() }));
vi.mock("@/comptes/garde", () => garde);
vi.mock("@/db", () => ({ getPool: () => ({}) }));
const voyageurs = vi.hoisted(() => ({
  accueillirLeVoyageur: vi.fn(async (): Promise<unknown> => "accueilli"),
  refuserLeVoyageur: vi.fn(async (): Promise<unknown> => true),
}));
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
    expect(await accueillirUnVoyageur(70)).toBe("accueilli");
    expect(garde.exigerCompte).toHaveBeenCalledWith("/jeu/habitants");
    // US-0335 : sans Métier choisi, il arrive sans Métier.
    expect(voyageurs.accueillirLeVoyageur).toHaveBeenCalledExactlyOnceWith(expect.anything(), 12, 70, expect.any(Date), null);
    const instant = (voyageurs.accueillirLeVoyageur.mock.lastCall as unknown as [unknown, number, number, Date])[3].getTime();
    expect(instant).toBeGreaterThanOrEqual(avant);
    expect(instant).toBeLessThanOrEqual(Date.now());
    expect(voyageurs.refuserLeVoyageur).not.toHaveBeenCalled();
    expect(cache.refresh).toHaveBeenCalledTimes(1);
  });

  it("accueille avec le Métier choisi, qui passe tel quel à l'accueil, vérifié dans sa transaction (US-0335)", async () => {
    garde.exigerCompte.mockResolvedValue(CONNECTE);
    expect(await accueillirUnVoyageur(70, "chasseur")).toBe("accueilli");
    expect(voyageurs.accueillirLeVoyageur).toHaveBeenCalledExactlyOnceWith(expect.anything(), 12, 70, expect.any(Date), "chasseur");
    expect(cache.refresh).toHaveBeenCalledTimes(1);
    await accueillirUnVoyageur(71, null);
    expect(voyageurs.accueillirLeVoyageur).toHaveBeenLastCalledWith(expect.anything(), 12, 71, expect.any(Date), null);
  });

  it.each([["Chasseur"], [""], ["chasseur; drop"], ["a".repeat(65)], [42 as unknown as string], [{} as unknown as string]])(
    "n'accueille personne pour un Métier qui n'est pas écrit comme un identifiant de Métier : %s (US-0335)",
    async (metier) => {
      garde.exigerCompte.mockResolvedValue(CONNECTE);
      expect(await accueillirUnVoyageur(70, metier)).toBeUndefined();
      expect(voyageurs.accueillirLeVoyageur).not.toHaveBeenCalled();
      expect(cache.refresh).not.toHaveBeenCalled();
    },
  );

  it.each([["reparti"], ["plus-de-place"], ["metier-inconnu"]])(
    "rend, après avoir relu la page, pourquoi le Voyageur n'a pas été accueilli : %s (US-0337, US-0338, US-0335)",
    async (raison) => {
      garde.exigerCompte.mockResolvedValue(CONNECTE);
      voyageurs.accueillirLeVoyageur.mockResolvedValueOnce(raison);
      expect(await accueillirUnVoyageur(70)).toBe(raison);
      expect(cache.refresh).toHaveBeenCalledTimes(1);
    },
  );
});

describe("refuser un Voyageur (US-0336)", () => {
  it("passe par la garde, puis fait repartir le Voyageur aux portes du Territoire du joueur, à l'heure du jeu, et relit la page", async () => {
    garde.exigerCompte.mockResolvedValue(CONNECTE);
    const avant = Date.now();
    await refuserUnVoyageur(70);
    expect(garde.exigerCompte).toHaveBeenCalledWith("/jeu/habitants");
    // US-0337 : le refus garde son heure.
    expect(voyageurs.refuserLeVoyageur).toHaveBeenCalledExactlyOnceWith(expect.anything(), 12, 70, expect.any(Date));
    const instant = (voyageurs.refuserLeVoyageur.mock.lastCall as unknown as [unknown, number, number, Date])[3].getTime();
    expect(instant).toBeGreaterThanOrEqual(avant);
    expect(instant).toBeLessThanOrEqual(Date.now());
    expect(voyageurs.accueillirLeVoyageur).not.toHaveBeenCalled();
    expect(cache.refresh).toHaveBeenCalledTimes(1);
  });
});

describe.each([
  { action: "accueillir", faire: accueillirUnVoyageur, ecrire: voyageurs.accueillirLeVoyageur, nAttendPlus: "absent" },
  { action: "refuser", faire: refuserUnVoyageur, ecrire: voyageurs.refuserLeVoyageur, nAttendPlus: false },
])("$action un Voyageur, comme tout ce qui se fait aux portes (US-0334, US-0336)", ({ faire, ecrire, nAttendPlus }) => {
  it("relit la page même quand le Voyageur n'attend plus (accueilli, refusé ailleurs, ou pas à ce joueur) : la page relue fait foi", async () => {
    garde.exigerCompte.mockResolvedValue(CONNECTE);
    ecrire.mockResolvedValueOnce(nAttendPlus);
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
