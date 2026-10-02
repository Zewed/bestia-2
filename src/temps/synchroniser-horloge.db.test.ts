import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { poolDeTest, URL_TEST } from "@/test/base";
import { rattraperLesAbsents } from "./absents";
import { definirAncre, maintenant } from "./horloge";
import { lireMarquePage } from "./marque-page";
import { rattraper } from "./rattraper";
import { synchroniserHorloge } from "./synchroniser-horloge";

const R0 = new Date("2026-03-01T12:00:00Z").getTime();
const MINUTE = 60_000;

describe.skipIf(!URL_TEST)("temps accéléré (sur base)", () => {
  let pool: Pool;

  beforeAll(() => {
    pool = poolDeTest();
  });
  beforeEach(async () => {
    // L'horloge de la base de test repart de zéro à chaque test.
    await pool.query("delete from horloge");
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(R0);
  });
  afterEach(() => {
    vi.useRealTimers();
    definirAncre(null);
  });
  afterAll(async () => {
    await pool.query("delete from horloge");
    await pool.end();
  });

  it("fait passer le temps cent fois plus vite à ×100", async () => {
    await synchroniserHorloge(pool, 100);
    vi.setSystemTime(R0 + MINUTE);
    expect(maintenant()).toEqual(new Date(R0 + 100 * MINUTE));
  });

  it("ne fait jamais reculer l'heure du jeu quand on change de vitesse", async () => {
    await synchroniserHorloge(pool, 100);
    vi.setSystemTime(R0 + MINUTE);
    const avant = maintenant().getTime();
    await synchroniserHorloge(pool, 1); // retour à vitesse normale
    expect(maintenant().getTime()).toBeGreaterThanOrEqual(avant);
    vi.setSystemTime(R0 + 2 * MINUTE);
    expect(maintenant()).toEqual(new Date(R0 + 101 * MINUTE)); // une minute de plus, à vitesse normale
    await synchroniserHorloge(pool, 1); // même vitesse : rien ne bouge
    expect(maintenant()).toEqual(new Date(R0 + 101 * MINUTE));
  });

  it("reprend l'ancre enregistrée au redémarrage du serveur", async () => {
    await synchroniserHorloge(pool, 100);
    vi.setSystemTime(R0 + 3 * MINUTE);
    definirAncre(null); // un autre serveur qui démarre
    await synchroniserHorloge(pool, 100);
    expect(maintenant()).toEqual(new Date(R0 + 300 * MINUTE));
  });

  it("entraîne le rattrapage à l'ouverture d'une page et la tâche planifiée", async () => {
    await synchroniserHorloge(pool, 100);
    const ids: number[] = [];
    for (let i = 0; i < 2; i++) {
      const { rows } = await pool.query<{ id: number }>(
        "insert into monde (nom, calcule_jusqu_a) values ($1, $2) returning id",
        [`essai-${randomUUID()}`, new Date(R0)],
      );
      ids.push(rows[0].id);
    }
    vi.setSystemTime(R0 + MINUTE);
    await rattraper("monde", ids[0], { pool });
    await rattraperLesAbsents({ pool, parmi: [ids[1]] });
    for (const id of ids) expect(await lireMarquePage(pool, "monde", id)).toEqual(new Date(R0 + 100 * MINUTE));
  });
});
