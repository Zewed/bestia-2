import { afterEach, describe, expect, it, vi } from "vitest";

const garde = vi.hoisted(() => ({ exigerCompte: vi.fn() }));
vi.mock("@/comptes/garde", () => garde);
vi.mock("@/db", () => ({ getPool: () => ({}) }));
const recits = vi.hoisted(() => ({ marquerUnRecitLu: vi.fn(async () => true) }));
vi.mock("@/monde/recits", () => recits);
const cache = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/cache", () => cache);

import { lireUnRecit } from "./actions";

describe("ouvrir un Récit le note comme lu (US-0324)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    garde.exigerCompte.mockReset();
    recits.marquerUnRecitLu.mockClear();
    cache.refresh.mockClear();
  });

  it("passe par la garde, puis note lu le Récit dans le Territoire du joueur, et relit la page et la barre", async () => {
    garde.exigerCompte.mockResolvedValue({ id: 7, email: "nom@exemple.fr", nomDeChef: "Ourse", territoireId: 12, recitLu: true });
    await lireUnRecit(40);
    expect(garde.exigerCompte).toHaveBeenCalledWith("/jeu/recits");
    expect(recits.marquerUnRecitLu).toHaveBeenCalledWith(expect.anything(), 12, 40, expect.any(Date));
    expect(cache.refresh).toHaveBeenCalledTimes(1);
  });

  it("ne relit rien quand le Récit n'a pas changé : déjà lu, ou pas à ce joueur", async () => {
    garde.exigerCompte.mockResolvedValue({ territoireId: 12 });
    recits.marquerUnRecitLu.mockResolvedValueOnce(false);
    await lireUnRecit(41);
    expect(cache.refresh).not.toHaveBeenCalled();
  });

  it("s'arrête à la garde sans session : rien n'est noté", async () => {
    garde.exigerCompte.mockRejectedValue(Object.assign(new Error("NEXT_REDIRECT"), { digest: "NEXT_REDIRECT;replace;/connexion?suite=%2Fjeu%2Frecits;307;" }));
    await expect(lireUnRecit(40)).rejects.toMatchObject({ digest: expect.stringContaining("/connexion") });
    expect(recits.marquerUnRecitLu).not.toHaveBeenCalled();
  });

  it.each([[0], [-3], [1.5], [Number.NaN], [2 ** 31], ["40" as unknown as number]])("ignore un identifiant qui n'en est pas un : %s", async (id) => {
    garde.exigerCompte.mockResolvedValue({ territoireId: 12 });
    await lireUnRecit(id);
    expect(recits.marquerUnRecitLu).not.toHaveBeenCalled();
  });

  it("ne fait rien pour un chef sans Territoire", async () => {
    garde.exigerCompte.mockResolvedValue({ territoireId: null });
    await lireUnRecit(40);
    expect(recits.marquerUnRecitLu).not.toHaveBeenCalled();
  });

  it("ne fait rien en production tant que l'entrée du jeu est fermée", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    await lireUnRecit(40);
    expect(garde.exigerCompte).not.toHaveBeenCalled();
    expect(recits.marquerUnRecitLu).not.toHaveBeenCalled();
  });
});
