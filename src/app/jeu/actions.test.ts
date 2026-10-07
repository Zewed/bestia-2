import { afterEach, describe, expect, it, vi } from "vitest";

const garde = vi.hoisted(() => ({ exigerCompte: vi.fn() }));
vi.mock("@/comptes/garde", () => garde);
vi.mock("@/db", () => ({ getPool: () => ({}) }));
const absence = vi.hoisted(() => ({ noterLaPresence: vi.fn(async () => {}) }));
vi.mock("@/monde/absence", () => absence);

import { noterMaPresence } from "./actions";

describe("noter la présence du joueur (US-0216)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    absence.noterLaPresence.mockClear();
  });

  it("passe par la garde, qui met le Territoire à l'heure, puis note la présence", async () => {
    garde.exigerCompte.mockResolvedValueOnce({ territoireId: 12 });
    await noterMaPresence();
    expect(garde.exigerCompte).toHaveBeenCalled();
    expect(absence.noterLaPresence).toHaveBeenCalledWith({}, 12, expect.any(Date));
  });

  it("ne fait rien en production tant que l'entrée du jeu est fermée", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    garde.exigerCompte.mockClear();
    await noterMaPresence();
    expect(garde.exigerCompte).not.toHaveBeenCalled();
    expect(absence.noterLaPresence).not.toHaveBeenCalled();
  });
});
