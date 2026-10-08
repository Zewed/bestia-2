import { afterEach, describe, expect, it, vi } from "vitest";

const garde = vi.hoisted(() => ({ exigerCompte: vi.fn() }));
vi.mock("@/comptes/garde", () => garde);
vi.mock("@/db", () => ({ getPool: () => ({}) }));
const lecture = vi.hoisted(() => ({ ficheDUneCase: vi.fn() }));
vi.mock("@/monde/fiche", () => lecture);

import { ficheDeLaCase } from "./actions";

/** La fiche d'une forêt libre, à 7 Cases du Foyer, telle que la base la lit. */
const FICHE = { q: 3, r: -5, biome: "Forêt", chef: null, aVous: false, zone: 0, distance: 7 };

describe("lire la fiche d'une Case (US-0428)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    garde.exigerCompte.mockReset();
    lecture.ficheDUneCase.mockReset();
  });

  it("passe par la garde, puis lit la Case dans le Monde du Territoire du joueur", async () => {
    garde.exigerCompte.mockResolvedValue({ id: 7, email: "nom@exemple.fr", nomDeChef: "Ourse", territoireId: 12, recitLu: true });
    lecture.ficheDUneCase.mockResolvedValue(FICHE);
    expect(await ficheDeLaCase(3, -5)).toEqual(FICHE);
    expect(garde.exigerCompte).toHaveBeenCalledWith("/jeu/carte");
    expect(lecture.ficheDUneCase).toHaveBeenCalledExactlyOnceWith(expect.anything(), 12, { q: 3, r: -5 });
  });

  it("ne rend rien d'une Case que le Monde du joueur n'a pas", async () => {
    garde.exigerCompte.mockResolvedValue({ territoireId: 12 });
    lecture.ficheDUneCase.mockResolvedValue(null);
    expect(await ficheDeLaCase(1000, 0)).toBeNull();
  });

  it("s'arrête à la garde sans session : rien n'est lu", async () => {
    garde.exigerCompte.mockRejectedValue(Object.assign(new Error("NEXT_REDIRECT"), { digest: "NEXT_REDIRECT;replace;/connexion?suite=%2Fjeu%2Fcarte;307;" }));
    await expect(ficheDeLaCase(3, -5)).rejects.toMatchObject({ digest: expect.stringContaining("/connexion") });
    expect(lecture.ficheDUneCase).not.toHaveBeenCalled();
  });

  it.each([
    [1.5, 0],
    [0, Number.NaN],
    [Number.POSITIVE_INFINITY, 0],
    [2 ** 31, 0],
    [0, -(2 ** 31) - 1],
    ["3" as unknown as number, 0],
    [null as unknown as number, 0],
  ])("ignore une Case dont les coordonnées n'en sont pas : (%s, %s)", async (q, r) => {
    garde.exigerCompte.mockResolvedValue({ territoireId: 12 });
    expect(await ficheDeLaCase(q, r)).toBeNull();
    expect(lecture.ficheDUneCase).not.toHaveBeenCalled();
  });

  it("ne rend rien à un chef sans Territoire", async () => {
    garde.exigerCompte.mockResolvedValue({ territoireId: null });
    expect(await ficheDeLaCase(3, -5)).toBeNull();
    expect(lecture.ficheDUneCase).not.toHaveBeenCalled();
  });

  it("ne rend rien en production tant que l'entrée du jeu est fermée", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect(await ficheDeLaCase(3, -5)).toBeNull();
    expect(garde.exigerCompte).not.toHaveBeenCalled();
  });
});
