import { afterEach, describe, expect, it, vi } from "vitest";
import type { Rappel } from "@/expeditions/rappel";

const garde = vi.hoisted(() => ({ exigerCompte: vi.fn() }));
vi.mock("@/comptes/garde", () => garde);
vi.mock("@/db", () => ({ getPool: () => ({}) }));
// Le rappel lui-même, sur base (src/expeditions/rappel.db.test.ts) : ici, ce que l'action lui confie.
const rappel = vi.hoisted(() => ({ rappelerLExpedition: vi.fn(async (): Promise<Rappel> => ({ rappeleeLe: new Date() })) }));
vi.mock("@/expeditions/rappel", () => rappel);
const INSTANT = new Date("2026-10-09T07:42:13.250Z");
vi.mock("@/temps/horloge", () => ({ maintenant: () => INSTANT }));
const cache = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/cache", () => cache);

import { rappeler } from "./actions";

describe("rappeler une Expédition depuis sa ligne ou sa fiche (US-0920)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    garde.exigerCompte.mockReset();
    rappel.rappelerLExpedition.mockClear();
    cache.refresh.mockClear();
  });
  const connecte = () => garde.exigerCompte.mockResolvedValue({ id: 7, email: "nom@exemple.fr", nomDeChef: "Ourse", territoireId: 12, recitLu: true });

  it("passe par la garde, rappelle l'Expédition du Territoire du joueur à l'heure du jeu, puis relit la page", async () => {
    connecte();
    await rappeler(5);
    expect(garde.exigerCompte).toHaveBeenCalledWith("/jeu/expeditions");
    expect(rappel.rappelerLExpedition).toHaveBeenCalledExactlyOnceWith(expect.anything(), 12, 5, INSTANT);
    expect(cache.refresh).toHaveBeenCalledTimes(1);
  });

  it("relit aussi la page après un rappel refusé : elle montre l'Expédition déjà au retour, ou rentrée", async () => {
    connecte();
    rappel.rappelerLExpedition.mockResolvedValueOnce({ refus: "Rappel refusé : l'Expédition est déjà sur le chemin du retour." });
    await rappeler(5);
    expect(cache.refresh).toHaveBeenCalledTimes(1);
  });

  it("s'arrête à la garde sans session : rien n'est rappelé", async () => {
    garde.exigerCompte.mockRejectedValue(Object.assign(new Error("NEXT_REDIRECT"), { digest: "NEXT_REDIRECT;replace;/connexion;307;" }));
    await expect(rappeler(5)).rejects.toMatchObject({ digest: expect.stringContaining("/connexion") });
    expect(rappel.rappelerLExpedition).not.toHaveBeenCalled();
  });

  it("ne fait rien tant que l'entrée du jeu est fermée en production", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    connecte();
    await rappeler(5);
    expect(garde.exigerCompte).not.toHaveBeenCalled();
    expect(rappel.rappelerLExpedition).not.toHaveBeenCalled();
  });

  it("ne fait rien pour un chef encore sans Territoire", async () => {
    garde.exigerCompte.mockResolvedValue({ territoireId: null });
    await rappeler(5);
    expect(rappel.rappelerLExpedition).not.toHaveBeenCalled();
  });

  it.each([
    ["un identifiant à virgule", 5.5],
    ["un identifiant nul", 0],
    ["un identifiant négatif", -5],
    ["un identifiant que la base ne tiendrait pas", 2_147_483_648],
    ["un nombre qui n'en est pas un", Number.NaN],
    ["un texte", "5" as unknown as number],
  ])("ne fait rien d'un appel que la page n'enverrait pas : %s", async (_, expeditionId) => {
    connecte();
    await rappeler(expeditionId);
    expect(rappel.rappelerLExpedition).not.toHaveBeenCalled();
  });
});
