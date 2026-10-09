import type { Pool } from "pg";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MissingEnvError } from "./env";
import { checkHealth } from "./health";
import { TACHE_EN_RETARD_MINUTES } from "./reglages";

// Le rattrapage du Monde a ses propres tests sur base ; ici, il répond tout de suite.
const rattrapage = vi.hoisted(() => ({ rattraper: vi.fn(async () => new Date("2026-10-02T08:00:00Z")) }));
vi.mock("./temps/rattraper", () => rattrapage);

const PRODUCTION_TIMELINE = "2ef3d9ca2dbef4d3407b201804d9325d";
// Assemblée en morceaux pour ne pas déclencher le scan de secrets.
const SECRET_URL = ["postgresql://neondb_owner:", "motdepasse-secret", "@ep-exemple.neon.tech/neondb"].join("");
const saved = { ...process.env };

function poolAnswering(database: string, timeline: string | null): () => Pool {
  return () =>
    ({
      query: async (sql: string) => ({
        rows: sql.includes("from monde")
          ? [{ id: 1, nom: "Aube" }]
          : sql.includes("from passage_tache")
            ? [{ debut: new Date("2026-10-02T08:00:00Z") }]
            : [{ database, timeline }],
      }),
    }) as unknown as Pool;
}

function poolFailing(error: Error): () => Pool {
  return () => ({ query: async () => Promise.reject(error) }) as unknown as Pool;
}

function driverError(code: string, message: string): Error {
  return Object.assign(new Error(message), { code });
}

beforeEach(() => {
  process.env.VERCEL_GIT_COMMIT_SHA = "086bdc1f00d4c0ffee";
  process.env.VERCEL_ENV = "production";
  process.env.DATABASE_URL = SECRET_URL;
});

afterEach(() => {
  process.env = { ...saved };
});

describe("page de santé", () => {
  it("répond ok avec la version en ligne quand la base répond", async () => {
    const { httpStatus, body } = await checkHealth(poolAnswering("neondb", PRODUCTION_TIMELINE));
    expect(httpStatus).toBe(200);
    expect(body).toMatchObject({
      statut: "ok",
      version: "086bdc1",
      environnement: "production",
      base: { statut: "ok", production: true, monde: "Aube", calculeJusquA: "2026-10-02T08:00:00.000Z" },
    });
  });

  it("signale un Monde qui n'a pas pu être rattrapé", async () => {
    rattrapage.rattraper.mockRejectedValueOnce(Object.assign(new Error("rattrapage"), { name: "RattrapageError" }));
    const { httpStatus, body } = await checkHealth(poolAnswering("neondb", PRODUCTION_TIMELINE));
    expect(httpStatus).toBe(503);
    expect(body.base).toMatchObject({ code: "RATTRAPAGE_ECHOUE" });
  });

  it("dit si la tâche planifiée est passée récemment, ou si elle est en retard", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-02T08:05:00Z"));
    expect((await checkHealth(poolAnswering("neondb", PRODUCTION_TIMELINE))).body.tache).toEqual({
      dernierPassage: "2026-10-02T08:00:00.000Z",
      enRetard: false,
    });
    // Trois passages manqués : en retard (US-0029), quel que soit le rythme de la tâche (src/reglages.ts).
    vi.setSystemTime(new Date(Date.parse("2026-10-02T08:00:00Z") + TACHE_EN_RETARD_MINUTES * 60_000));
    expect((await checkHealth(poolAnswering("neondb", PRODUCTION_TIMELINE))).body.tache?.enRetard).toBe(false);
    vi.setSystemTime(new Date(Date.parse("2026-10-02T08:00:00Z") + TACHE_EN_RETARD_MINUTES * 60_000 + 60_000));
    expect((await checkHealth(poolAnswering("neondb", PRODUCTION_TIMELINE))).body.tache?.enRetard).toBe(true);
    vi.useRealTimers();
  });

  it("dit quand la base n'est pas celle de production", async () => {
    const { body } = await checkHealth(poolAnswering("bestia_dev", PRODUCTION_TIMELINE));
    expect(body.base).toMatchObject({ statut: "ok", production: false });
  });

  it("donne « local » hors de Vercel", async () => {
    delete process.env.VERCEL_GIT_COMMIT_SHA;
    delete process.env.VERCEL_ENV;
    const { body } = await checkHealth(poolAnswering("bestia_dev", null));
    expect(body).toMatchObject({ version: "local", environnement: "local" });
  });

  it("signale une base injoignable avec un code d'erreur", async () => {
    const { httpStatus, body } = await checkHealth(poolFailing(driverError("ECONNREFUSED", "connect ECONNREFUSED")));
    expect(httpStatus).toBe(503);
    expect(body).toMatchObject({
      statut: "panne",
      base: { statut: "panne", code: "ECONNREFUSED", raison: "le serveur refuse la connexion" },
    });
  });

  it("signale une adresse de base absente", async () => {
    const { httpStatus, body } = await checkHealth(() => {
      throw new MissingEnvError(["DATABASE_URL"]);
    });
    expect(httpStatus).toBe(503);
    expect(body.base).toMatchObject({ code: "VARIABLE_MANQUANTE" });
  });

  it("signale une erreur inattendue de la base sans la recopier", async () => {
    const { httpStatus, body } = await checkHealth(poolFailing(driverError("42P01", `relation absente, ${SECRET_URL}`)));
    expect(httpStatus).toBe(503);
    expect(body.base).toMatchObject({ code: "42P01", raison: "la base a renvoyé une erreur" });
  });

  it.each([
    ["réseau", driverError("ENOTFOUND", `getaddrinfo ENOTFOUND ${SECRET_URL}`)],
    ["mot de passe", driverError("28P01", `password authentication failed, ${SECRET_URL}`)],
    ["inconnue", driverError("XX000", SECRET_URL)],
    ["délai", new Error(`timeout while connecting to ${SECRET_URL}`)],
  ])("n'expose aucun secret, même en panne (%s)", async (_, error) => {
    const text = JSON.stringify((await checkHealth(poolFailing(error))).body);
    expect(text).not.toContain("motdepasse-secret");
    expect(text).not.toContain("neon.tech");
    expect(text).not.toContain("postgres");
    expect(text).not.toContain("DATABASE_URL");
  });
});
