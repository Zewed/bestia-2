import { afterEach, describe, expect, it, vi } from "vitest";

const garde = vi.hoisted(() => ({ exigerCompte: vi.fn(), PAGE_ARRIVEE: "/jeu/arrivee" }));
vi.mock("@/comptes/garde", () => garde);
const territoire = vi.hoisted(() => ({ marquerRecitLu: vi.fn(async () => true) }));
vi.mock("@/monde/territoire", () => territoire);
vi.mock("@/db", () => ({ getPool: () => ({}) }));

import { entrerDansLeFoyer } from "./actions";

describe("entrer dans son Foyer après le récit (US-0158, US-0160)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    territoire.marquerRecitLu.mockClear();
  });

  it("note le récit comme lu, puis mène au Foyer", async () => {
    garde.exigerCompte.mockResolvedValue({ id: 7, email: "nom@exemple.fr", nomDeChef: "Ourse", territoireId: 12, recitLu: false });
    await expect(entrerDansLeFoyer()).rejects.toMatchObject({ digest: expect.stringMatching(/;\/jeu;/) });
    expect(garde.exigerCompte).toHaveBeenCalledWith("/jeu/arrivee");
    expect(territoire.marquerRecitLu).toHaveBeenCalledWith(expect.anything(), 12, expect.any(Date));
  });

  it("ne fait rien en production tant que l'entrée du jeu est fermée", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    await entrerDansLeFoyer();
    expect(territoire.marquerRecitLu).not.toHaveBeenCalled();
  });
});
