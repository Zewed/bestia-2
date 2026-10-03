import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { proxy } from "../proxy";
import { DEMANDE_MOT_DE_PASSE, motDePasseAccepte } from "./acces";

const basic = (identifiants: string) => `Basic ${Buffer.from(identifiants, "utf8").toString("base64")}`;
const ATTENDU = "mot-de-passe-d-essai";

describe("mot de passe de contrôle", () => {
  it("accepte le bon mot de passe, quel que soit le nom saisi", () => {
    expect(motDePasseAccepte(basic(`antoine:${ATTENDU}`), ATTENDU)).toBe(true);
    expect(motDePasseAccepte(basic(`:${ATTENDU}`), ATTENDU)).toBe(true);
    expect(motDePasseAccepte(basic("dev:a:b"), "a:b")).toBe(true);
  });

  it.each([
    ["sans en-tête", null],
    ["avec un autre mot de passe", basic("dev:autre")],
    ["avec un autre type d'accès", `Bearer ${ATTENDU}`],
    ["avec des identifiants mal formés", basic(ATTENDU)],
  ])("refuse l'accès %s", (_, authorization) => {
    expect(motDePasseAccepte(authorization, ATTENDU)).toBe(false);
  });

  it("garde la page fermée tant que le mot de passe n'est pas réglé", () => {
    expect(motDePasseAccepte(basic("dev:"), undefined)).toBe(false);
    expect(motDePasseAccepte(basic("dev:"), "")).toBe(false);
    expect(motDePasseAccepte(basic("dev:  "), "  ")).toBe(false);
  });
});

describe("proxy des pages de contrôle", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const demande = (authorization?: string) =>
    new NextRequest("https://bestia.test/controle", { headers: authorization ? { authorization } : {} });

  it("fait demander le mot de passe par le navigateur", () => {
    vi.stubEnv("CONTROLE_MOT_DE_PASSE", ATTENDU);
    const reponse = proxy(demande());
    expect(reponse?.status).toBe(401);
    expect(reponse?.headers.get("WWW-Authenticate")).toBe(DEMANDE_MOT_DE_PASSE);
    expect(reponse?.headers.get("Cache-Control")).toBe("no-store");
  });

  it("laisse passer avec le bon mot de passe", () => {
    vi.stubEnv("CONTROLE_MOT_DE_PASSE", ATTENDU);
    expect(proxy(demande(basic(`dev:${ATTENDU}`)))).toBeUndefined();
  });
});

describe("liens vers la page de contrôle", () => {
  const SRC = join(__dirname, "..");
  const sources = (dir: string): string[] =>
    readdirSync(dir).flatMap((nom) => {
      const chemin = join(dir, nom);
      if (statSync(chemin).isDirectory()) return sources(chemin);
      return /\.tsx$/.test(nom) && !/\.test\.tsx$/.test(nom) ? [chemin] : [];
    });

  it("aucune page visible par un joueur n'y mène", () => {
    const avecLien = sources(SRC).filter(
      (fichier) => !fichier.includes(join("app", "controle")) && readFileSync(fichier, "utf8").includes('"/controle'),
    );
    expect(avecLien.map((f) => relative(SRC, f))).toEqual([]);
  });
});
