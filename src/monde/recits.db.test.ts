import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chefDuCompte, enregistrerNomDeChef } from "@/chefs/chef";
import { creerCompte } from "@/comptes/compte";
import { poolDeTest, preparerMondeDeTest, URL_TEST } from "@/test/base";
import { ecrireUnRecit, marquerUnRecitLu, nombreDeRecitsNonLus, recitsDuTerritoire } from "./recits";

describe.skipIf(!URL_TEST)("les Récits d'un Territoire (US-0324, sur base)", () => {
  let pool: Pool;
  const lancement = `recits-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let numero = 0;
  /** Un nom de chef propre à ce lancement, pour ne pas croiser les autres essais. */
  const nomUnique = () => `Recit${lancement.slice(-5).replace(/[^a-z]/g, "x")}${"abcdefghij"[Math.floor(numero / 10) % 10]}${"abcdefghij"[numero % 10]}`;
  const naitre = async () => {
    const compte = (await creerCompte(pool, `${lancement}-${++numero}@essai.test`, "une phrase de passe"))!;
    expect(await enregistrerNomDeChef(pool, compte.id, nomUnique())).toMatchObject({ statut: "enregistre" });
    return { compteId: compte.id, territoireId: (await chefDuCompte(pool, compte.id))!.territoireId! };
  };
  const a = (heure: string) => new Date(`2026-10-07T${heure}:00Z`);

  beforeAll(async () => {
    pool = poolDeTest();
    await preparerMondeDeTest(pool);
  });
  afterAll(async () => {
    await pool.query("delete from compte where email like $1", [`${lancement}-%`]);
    await pool.end();
  });

  it("n'en donne aucun à un Territoire qui vient de naître", async () => {
    const { territoireId } = await naitre();
    expect(await recitsDuTerritoire(pool, territoireId)).toEqual([]);
    expect(await nombreDeRecitsNonLus(pool, territoireId)).toBe(0);
  });

  it("écrit un Récit daté de l'heure du jeu où l'événement est survenu, non lu", async () => {
    const { territoireId } = await naitre();
    const id = await ecrireUnRecit(pool, territoireId, { titre: "Famine", texte: "Deux Habitants sont partis.\nIls ne reviendront pas.", survenuLe: a("14:05") });
    expect(id).toEqual(expect.any(Number));
    expect(await recitsDuTerritoire(pool, territoireId)).toEqual([
      { id, titre: "Famine", texte: "Deux Habitants sont partis.\nIls ne reviendront pas.", survenuLe: a("14:05"), luLe: null },
    ]);
  });

  it("écrit dans la transaction de l'événement qui le produit : annulée, elle n'en laisse rien", async () => {
    const { territoireId } = await naitre();
    const client = await pool.connect();
    try {
      await client.query("begin");
      await ecrireUnRecit(client, territoireId, { titre: "Retour de Récolte", texte: "Du Bois.", survenuLe: a("09:00") });
      expect(await recitsDuTerritoire(client, territoireId)).toHaveLength(1);
      await client.query("rollback");
    } finally {
      client.release();
    }
    expect(await recitsDuTerritoire(pool, territoireId)).toEqual([]);
  });

  it("les range du plus récent au plus ancien, selon l'heure où ils sont survenus et non l'ordre d'écriture", async () => {
    const { territoireId } = await naitre();
    const ecrire = (titre: string, heure: string) => ecrireUnRecit(pool, territoireId, { titre, texte: titre, survenuLe: a(heure) });
    await ecrire("Midi", "12:00");
    await ecrire("Matin", "08:00");
    await ecrire("Soir", "19:30");
    await ecrire("Midi, plus tard écrit", "12:00");
    expect((await recitsDuTerritoire(pool, territoireId)).map((r) => r.titre)).toEqual(["Soir", "Midi, plus tard écrit", "Midi", "Matin"]);
  });

  it("compte les non lus, et en retire chacun une fois ouvert, une seule fois", async () => {
    const { territoireId } = await naitre();
    const [premier, second] = [
      await ecrireUnRecit(pool, territoireId, { titre: "Un", texte: "Un.", survenuLe: a("10:00") }),
      await ecrireUnRecit(pool, territoireId, { titre: "Deux", texte: "Deux.", survenuLe: a("11:00") }),
    ];
    expect(await nombreDeRecitsNonLus(pool, territoireId)).toBe(2);
    expect(await marquerUnRecitLu(pool, territoireId, premier, a("15:00"))).toBe(true);
    expect(await nombreDeRecitsNonLus(pool, territoireId)).toBe(1);
    // Rouvert plus tard, il garde l'heure de sa première lecture.
    expect(await marquerUnRecitLu(pool, territoireId, premier, a("16:00"))).toBe(false);
    expect((await recitsDuTerritoire(pool, territoireId)).map((r) => [r.id, r.luLe])).toEqual([
      [second, null],
      [premier, a("15:00")],
    ]);
  });

  it("garde les Récits de chacun pour lui seul : ni lus, ni comptés, ni marqués par un autre", async () => {
    const [joueur, voisin] = [await naitre(), await naitre()];
    const sien = await ecrireUnRecit(pool, joueur.territoireId, { titre: "Le mien", texte: "À moi.", survenuLe: a("10:00") });
    const autre = await ecrireUnRecit(pool, voisin.territoireId, { titre: "Le sien", texte: "Au voisin.", survenuLe: a("11:00") });
    expect((await recitsDuTerritoire(pool, joueur.territoireId)).map((r) => r.id)).toEqual([sien]);
    expect((await recitsDuTerritoire(pool, voisin.territoireId)).map((r) => r.id)).toEqual([autre]);
    expect(await nombreDeRecitsNonLus(pool, joueur.territoireId)).toBe(1);
    expect(await marquerUnRecitLu(pool, joueur.territoireId, autre, a("12:00"))).toBe(false);
    expect(await nombreDeRecitsNonLus(pool, voisin.territoireId)).toBe(1);
    expect(await marquerUnRecitLu(pool, joueur.territoireId, -1, a("12:00"))).toBe(false);
  });

  it("les retire avec leur Territoire", async () => {
    const { compteId, territoireId } = await naitre();
    await ecrireUnRecit(pool, territoireId, { titre: "Éphémère", texte: "Bientôt parti.", survenuLe: a("10:00") });
    await pool.query("delete from compte where id = $1", [compteId]);
    expect(await recitsDuTerritoire(pool, territoireId)).toEqual([]);
  });
});
