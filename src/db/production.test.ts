import type { Pool } from "pg";
import { afterEach, describe, expect, it } from "vitest";
import { assertNotProductionDatabase, identifyDatabase } from "./production";

const PRODUCTION_TIMELINE = "2ef3d9ca2dbef4d3407b201804d9325d";
const savedEnv = process.env.VERCEL_ENV;

function fakePool(database: string, timeline: string | null): Pool {
  return { query: async () => ({ rows: [{ database, timeline }] }) } as unknown as Pool;
}

afterEach(() => {
  if (savedEnv === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = savedEnv;
});

describe("reconnaître la base de production", () => {
  it("reconnaît neondb sur la branche principale", async () => {
    expect(await identifyDatabase(fakePool("neondb", PRODUCTION_TIMELINE))).toEqual({
      database: "neondb",
      branch: "2ef3d9ca",
      isProduction: true,
    });
  });

  it("distingue la base de développement, sur la même branche", async () => {
    expect((await identifyDatabase(fakePool("bestia_dev", PRODUCTION_TIMELINE))).isProduction).toBe(false);
  });

  it("distingue la branche d'une prévisualisation", async () => {
    expect((await identifyDatabase(fakePool("neondb", "7cbbfdb0aaaaaaaaaaaaaaaaaaaaaaaa"))).isProduction).toBe(false);
  });

  it("distingue une base Postgres hors Neon", async () => {
    expect(await identifyDatabase(fakePool("postgres", null))).toMatchObject({ branch: null, isProduction: false });
  });
});

describe("garde-fou hors production", () => {
  it("refuse la base de production depuis une prévisualisation", async () => {
    process.env.VERCEL_ENV = "preview";
    await expect(assertNotProductionDatabase(fakePool("neondb", PRODUCTION_TIMELINE), "Migration refusée")).rejects.toThrow(
      "Migration refusée : cet environnement (preview) est branché sur la base de production.",
    );
  });

  it("refuse la base de production depuis le poste local", async () => {
    delete process.env.VERCEL_ENV;
    await expect(assertNotProductionDatabase(fakePool("neondb", PRODUCTION_TIMELINE), "Migration refusée")).rejects.toThrow(
      "(local)",
    );
  });

  it("laisse la production travailler sur sa base", async () => {
    process.env.VERCEL_ENV = "production";
    await expect(assertNotProductionDatabase(fakePool("neondb", PRODUCTION_TIMELINE), "Migration refusée")).resolves.toMatchObject({
      isProduction: true,
    });
  });
});
