import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { chefDuCompte, enregistrerNomDeChef } from "@/chefs/chef";
import { creerCompte } from "@/comptes/compte";
import { ecrireUnRecit, recitsDuTerritoire } from "@/monde/recits";
import { poolDeTest, preparerMondeDeTest, URL_TEST } from "@/test/base";

// La garde dit qui est connecté ; l'action écrit pour de bon dans la base de test.
const garde = vi.hoisted(() => ({ exigerCompte: vi.fn() }));
vi.mock("@/comptes/garde", () => garde);
const base = vi.hoisted(() => ({ pool: null as Pool | null }));
vi.mock("@/db", async (original) => ({ ...(await original<object>()), getPool: () => base.pool }));
vi.mock("next/cache", () => ({ refresh: vi.fn() }));

import { lireUnRecit } from "./actions";

describe.skipIf(!URL_TEST)("ouvrir un Récit, sur base (US-0324)", () => {
  let pool: Pool;
  const lancement = `lire-recit-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let numero = 0;
  const nomUnique = () => `Lect${lancement.slice(-5).replace(/[^a-z]/g, "x")}${"abcdefghij"[Math.floor(numero / 10) % 10]}${"abcdefghij"[numero % 10]}`;
  const naitre = async () => {
    const compte = (await creerCompte(pool, `${lancement}-${++numero}@essai.test`, "une phrase de passe"))!;
    expect(await enregistrerNomDeChef(pool, compte.id, nomUnique())).toMatchObject({ statut: "enregistre" });
    return (await chefDuCompte(pool, compte.id))!.territoireId!;
  };
  const lus = async (territoireId: number) => (await recitsDuTerritoire(pool, territoireId)).map((r) => [r.titre, r.luLe !== null]);

  beforeAll(async () => {
    pool = poolDeTest();
    base.pool = pool;
    await preparerMondeDeTest(pool);
  });
  afterAll(async () => {
    await pool.query("delete from compte where email like $1", [`${lancement}-%`]);
    await pool.end();
  });

  it("ne marque que les Récits du joueur connecté, jamais ceux d'un autre, même en envoyant leur identifiant", async () => {
    const [joueur, voisin] = [await naitre(), await naitre()];
    const survenuLe = new Date("2026-10-07T10:00:00Z");
    const sien = await ecrireUnRecit(pool, joueur, { titre: "Le mien", texte: "À moi.", survenuLe });
    const autre = await ecrireUnRecit(pool, voisin, { titre: "Le sien", texte: "Au voisin.", survenuLe });
    garde.exigerCompte.mockResolvedValue({ id: 1, email: "nom@exemple.fr", nomDeChef: "Ourse", territoireId: joueur, recitLu: true });

    await lireUnRecit(autre);
    expect(await lus(voisin)).toEqual([["Le sien", false]]);
    expect(await lus(joueur)).toEqual([["Le mien", false]]);

    await lireUnRecit(sien);
    expect(await lus(joueur)).toEqual([["Le mien", true]]);
    expect(await lus(voisin)).toEqual([["Le sien", false]]);
  });
});
