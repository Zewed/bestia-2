import type { Pool } from "pg";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { poolDeTest, preparerMondeDeTest, URL_TEST } from "@/test/base";
import { lireJeu } from "./charger";
import { ESPECES, ESPECES_D_ESSAI, lireDonneesPour, type EntreeEspece } from "./jeux";

const essais = lireJeu(ESPECES_D_ESSAI);

describe.skipIf(!URL_TEST)("les Espèces d'essai en base (US-0924)", () => {
  let pool: Pool;

  /** Les identifiants des Espèces que le chargement écrirait dans la base de test. */
  const especesAEcrire = async () =>
    (await lireDonneesPour(pool)).filter((l) => l.jeu.table === "espece").flatMap((l) => (l.entrees as EntreeEspece[]).map((e) => e.id));

  beforeAll(async () => {
    pool = poolDeTest();
    await preparerMondeDeTest(pool);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });
  afterAll(async () => {
    await pool.end();
  });

  it("sont chargées dans la base de test, avec les caractéristiques que le barème tire de leurs mesures", async () => {
    const { rows } = await pool.query<{ id: string; attaque: number; vie: number; biome_id: string; rarete_id: string; illustration: string | null }>(
      "select id, attaque, vie, biome_id, rarete_id, illustration from espece where id = any($1) order by id",
      [essais.map((e) => e.id)],
    );
    expect(rows.map((r) => r.id)).toEqual(essais.map((e) => e.id).sort());
    for (const e of essais) {
      const { attaque, vie, biome_id, rarete_id } = ESPECES.colonnes(e) as Record<string, unknown>;
      expect(rows.find((r) => r.id === e.id)).toMatchObject({ attaque, vie, biome_id, rarete_id, illustration: null });
    }
  });

  it("ne seraient pas écrites en ligne, en production comme en prévisualisation, sur la même base", async () => {
    expect(await especesAEcrire()).toEqual(expect.arrayContaining(essais.map((e) => e.id)));
    for (const environnement of ["production", "preview"]) {
      vi.stubEnv("VERCEL_ENV", environnement);
      expect(await especesAEcrire()).toEqual(lireJeu(ESPECES).map((e) => e.id));
    }
  });
});
