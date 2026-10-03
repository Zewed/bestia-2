import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const entetes = vi.hoisted(() => ({ authorization: null as string | null }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers(entetes.authorization ? { authorization: entetes.authorization } : {}),
}));
vi.mock("next/server", async (original) => ({ ...(await original<object>()), connection: async () => {} }));
vi.mock("@/db", () => ({ getPool: () => ({}) }));
vi.mock("@/temps/absents", () => ({
  derniersPassages: async () => [
    { debut: new Date("2026-10-03T09:05:00Z"), rattrapes: 0, echecs: 1, restants: 2, dureeMs: 45000, erreurs: [{ element: "tache", id: null, raison: "base injoignable" }] },
    { debut: new Date("2026-10-03T09:00:00Z"), rattrapes: 3, echecs: 0, restants: 0, dureeMs: 840, erreurs: [] },
  ],
}));

import Controle from "./page";

const MOT_DE_PASSE = "mot-de-passe-d-essai";

describe("page de contrôle", () => {
  beforeEach(() => {
    vi.stubEnv("CONTROLE_MOT_DE_PASSE", MOT_DE_PASSE);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    entetes.authorization = null;
  });

  it("répond « page introuvable » sans le mot de passe, même si le proxy était contourné", async () => {
    await expect(Controle()).rejects.toMatchObject({ digest: expect.stringContaining("404") });
  });

  it("montre l'heure du jeu, la vitesse du temps et les derniers passages de la tâche", async () => {
    entetes.authorization = `Basic ${Buffer.from(`dev:${MOT_DE_PASSE}`).toString("base64")}`;
    const html = renderToStaticMarkup(await Controle());
    expect(html).toContain("Heure du jeu");
    expect(html).toContain("×1");
    expect(html).toContain("Vitesse normale.");
    expect(html).toContain("1 échec : base injoignable");
    expect(html).toContain("Réussi");
    expect(html).toContain("0,8 s");
    expect(html.indexOf("1 échec")).toBeLessThan(html.indexOf("Réussi"));
  });
});
