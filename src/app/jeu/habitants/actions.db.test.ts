import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { chefDuCompte, enregistrerNomDeChef } from "@/chefs/chef";
import { creerCompte } from "@/comptes/compte";
import { habitantsDuTerritoire } from "@/monde/habitants";
import { poolDeTest, preparerMondeDeTest, URL_TEST } from "@/test/base";

// La garde dit qui est connecté ; l'action écrit pour de bon dans la base de test.
const garde = vi.hoisted(() => ({ exigerCompte: vi.fn() }));
vi.mock("@/comptes/garde", () => garde);
const base = vi.hoisted(() => ({ pool: null as Pool | null }));
vi.mock("@/db", async (original) => ({ ...(await original<object>()), getPool: () => base.pool }));
vi.mock("next/cache", () => ({ refresh: vi.fn() }));

import { ajouterAuMetier, donnerUnMetier, retirerDuMetier, retirerLeMetier } from "./actions";

describe.skipIf(!URL_TEST)("donner, changer ou retirer le Métier d'un Habitant, sur base (US-0308, US-0310, US-0311, US-0312, US-0315)", () => {
  let pool: Pool;
  const lancement = `donner-metier-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let numero = 0;
  const nomUnique = () => `Met${lancement.slice(-5).replace(/[^a-z]/g, "x")}${"abcdefghij"[Math.floor(numero / 10) % 10]}${"abcdefghij"[numero % 10]}`;
  const naitre = async () => {
    const compte = (await creerCompte(pool, `${lancement}-${++numero}@essai.test`, "une phrase de passe"))!;
    expect(await enregistrerNomDeChef(pool, compte.id, nomUnique())).toMatchObject({ statut: "enregistre" });
    return (await chefDuCompte(pool, compte.id))!.territoireId!;
  };
  /** Les Habitants du Territoire, du premier arrivé au dernier, avec le nom de leur Métier. */
  const metiers = async (territoireId: number) => (await habitantsDuTerritoire(pool, territoireId)).sort((a, b) => a.id - b.id).map((h) => [h.id, h.metier]);

  beforeAll(async () => {
    pool = poolDeTest();
    base.pool = pool;
    await preparerMondeDeTest(pool);
  });
  afterAll(async () => {
    await pool.query("delete from compte where email like $1", [`${lancement}-%`]);
    await pool.end();
  });

  it("ne donne de Métier qu'aux Habitants du joueur connecté, jamais à ceux d'un autre, même en envoyant leur identifiant", async () => {
    const [joueur, voisin] = [await naitre(), await naitre()];
    const [sien] = (await metiers(joueur)).map(([id]) => id as number);
    const [autre] = (await metiers(voisin)).map(([id]) => id as number);
    garde.exigerCompte.mockResolvedValue({ id: 1, email: "nom@exemple.fr", nomDeChef: "Ourse", territoireId: joueur, recitLu: true });

    await donnerUnMetier(autre, "bucheron");
    expect((await metiers(voisin)).map(([, metier]) => metier)).toEqual([null, null, null]);
    expect((await metiers(joueur)).map(([, metier]) => metier)).toEqual([null, null, null]);

    await donnerUnMetier(sien, "bucheron");
    expect((await metiers(joueur)).map(([, metier]) => metier)).toEqual(["Bûcheron", null, null]);
    expect((await metiers(voisin)).map(([, metier]) => metier)).toEqual([null, null, null]);
  });

  it("change le Métier d'un Habitant du joueur qui en a un, jamais celui d'un Habitant d'un autre (US-0310)", async () => {
    const [joueur, voisin] = [await naitre(), await naitre()];
    const [sien] = (await metiers(joueur)).map(([id]) => id as number);
    const [autre] = (await metiers(voisin)).map(([id]) => id as number);
    garde.exigerCompte.mockResolvedValue({ id: 1, email: "nom@exemple.fr", nomDeChef: "Ourse", territoireId: voisin, recitLu: true });
    await donnerUnMetier(autre, "chasseur");
    garde.exigerCompte.mockResolvedValue({ id: 1, email: "nom@exemple.fr", nomDeChef: "Ourse", territoireId: joueur, recitLu: true });

    await donnerUnMetier(sien, "chasseur");
    await donnerUnMetier(sien, "mineur");
    expect((await metiers(joueur)).map(([, metier]) => metier)).toEqual(["Mineur", null, null]);
    await donnerUnMetier(autre, "mineur");
    expect((await metiers(voisin)).map(([, metier]) => metier)).toEqual(["Chasseur", null, null]);
  });

  it("remet sans Métier un Habitant du joueur, jamais celui d'un Habitant d'un autre (US-0311)", async () => {
    const [joueur, voisin] = [await naitre(), await naitre()];
    const [sien] = (await metiers(joueur)).map(([id]) => id as number);
    const [autre] = (await metiers(voisin)).map(([id]) => id as number);
    garde.exigerCompte.mockResolvedValue({ id: 1, email: "nom@exemple.fr", nomDeChef: "Ourse", territoireId: voisin, recitLu: true });
    await donnerUnMetier(autre, "chasseur");
    garde.exigerCompte.mockResolvedValue({ id: 1, email: "nom@exemple.fr", nomDeChef: "Ourse", territoireId: joueur, recitLu: true });
    await donnerUnMetier(sien, "mineur");

    await retirerLeMetier(autre);
    expect((await metiers(voisin)).map(([, metier]) => metier)).toEqual(["Chasseur", null, null]);
    await retirerLeMetier(sien);
    expect((await metiers(joueur)).map(([, metier]) => metier)).toEqual([null, null, null]);
  });

  it("« + » et « − » ne changent que les Habitants du joueur connecté, jamais ceux d'un autre (US-0312)", async () => {
    const [joueur, voisin] = [await naitre(), await naitre()];
    garde.exigerCompte.mockResolvedValue({ id: 1, email: "nom@exemple.fr", nomDeChef: "Ourse", territoireId: joueur, recitLu: true });
    const avant = await metiers(voisin);

    await ajouterAuMetier("bucheron");
    await ajouterAuMetier("bucheron");
    expect((await metiers(joueur)).filter(([, metier]) => metier === "Bûcheron")).toHaveLength(2);
    await retirerDuMetier("bucheron");
    expect((await metiers(joueur)).filter(([, metier]) => metier === "Bûcheron")).toHaveLength(1);
    expect(await metiers(voisin)).toEqual(avant);
  });

  it("des « + » envoyés en même temps depuis deux onglets ne donnent un Métier qu'aux Habitants sans Métier, chacun le sien (US-0315)", async () => {
    const joueur = await naitre();
    garde.exigerCompte.mockResolvedValue({ id: 1, email: "nom@exemple.fr", nomDeChef: "Ourse", territoireId: joueur, recitLu: true });
    await Promise.all(["bucheron", "mineur", "bucheron", "mineur", "bucheron", "mineur"].map((metier) => ajouterAuMetier(metier)));
    const lus = (await metiers(joueur)).map(([, metier]) => metier);
    expect(lus.filter((metier) => metier === null)).toEqual([]);
    expect(lus).toHaveLength(3);
  });

  it("refuse sans bruit un Métier qui n'existe pas", async () => {
    const joueur = await naitre();
    const [sien] = (await metiers(joueur)).map(([id]) => id as number);
    garde.exigerCompte.mockResolvedValue({ id: 1, email: "nom@exemple.fr", nomDeChef: "Ourse", territoireId: joueur, recitLu: true });
    await expect(donnerUnMetier(sien, "poste")).resolves.toBeUndefined();
    expect((await metiers(joueur)).map(([, metier]) => metier)).toEqual([null, null, null]);
  });
});
