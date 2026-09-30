import { afterEach, describe, expect, it } from "vitest";
import { assertEnv, env, MissingEnvError } from "./env";

const saved = process.env.DATABASE_URL;

afterEach(() => {
  if (saved === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = saved;
});

describe("variables d'environnement", () => {
  it("nomme la variable qui manque", () => {
    delete process.env.DATABASE_URL;
    expect(() => assertEnv()).toThrow(MissingEnvError);
    expect(() => assertEnv()).toThrow(/DATABASE_URL/);
  });

  it("traite une variable vide comme manquante", () => {
    process.env.DATABASE_URL = "   ";
    expect(() => env("DATABASE_URL")).toThrow(/DATABASE_URL/);
  });

  it("rend la valeur sans les espaces autour", () => {
    process.env.DATABASE_URL = "  postgres://localhost/bestia  ";
    expect(() => assertEnv()).not.toThrow();
    expect(env("DATABASE_URL")).toBe("postgres://localhost/bestia");
  });
});
