import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { chefDuCompte, enregistrerNomDeChef } from "@/chefs/chef";
import { creerCompte } from "@/comptes/compte";
import { habitantsDuTerritoire } from "@/monde/habitants";
import { recitsDuTerritoire } from "@/monde/recits";
import { DEPART_VOYAGEUR, departDuVoyageur, voyageursAuxPortes } from "@/monde/voyageurs";
import { programmerEvenement } from "@/temps/avancer";
import { rattraper } from "@/temps/rattraper";
import { poolDeTest, preparerMondeDeTest, URL_TEST } from "@/test/base";

// La garde dit qui est connecté ; l'action écrit pour de bon dans la base de test.
const garde = vi.hoisted(() => ({ exigerCompte: vi.fn() }));
vi.mock("@/comptes/garde", () => garde);
const base = vi.hoisted(() => ({ pool: null as Pool | null }));
vi.mock("@/db", async (original) => ({ ...(await original<object>()), getPool: () => base.pool }));
vi.mock("next/cache", () => ({ refresh: vi.fn() }));

import { accueillirUnVoyageur, refuserUnVoyageur } from "./actions-aux-portes";

describe.skipIf(!URL_TEST)("les Voyageurs aux portes, accueillis ou refusés, sur base (US-0334, US-0336)", () => {
  let pool: Pool;
  const lancement = `aux-portes-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let numero = 0;
  const nomUnique = () => `Port${lancement.slice(-5).replace(/[^a-z]/g, "x")}${"abcdefghij"[Math.floor(numero / 10) % 10]}${"abcdefghij"[numero % 10]}`;
  const naitre = async () => {
    const compte = (await creerCompte(pool, `${lancement}-${++numero}@essai.test`, "une phrase de passe"))!;
    expect(await enregistrerNomDeChef(pool, compte.id, nomUnique())).toMatchObject({ statut: "enregistre" });
    return (await chefDuCompte(pool, compte.id))!.territoireId!;
  };
  /** Fait se présenter un Voyageur au Territoire, arrivé il y a une heure, sans passer par le temps. */
  const presenter = async (territoireId: number, prenom: string) =>
    (await pool.query<{ id: number }>("insert into voyageur (territoire_id, prenom, arrive_le) values ($1, $2, now() - interval '1 hour') returning id", [territoireId, prenom])).rows[0].id;
  /** Le joueur connecté, sur le Territoire donné. */
  const connecter = (territoireId: number) => garde.exigerCompte.mockResolvedValue({ id: 1, email: "nom@exemple.fr", nomDeChef: "Ourse", territoireId, recitLu: true });
  /** Les prénoms aux portes, et ceux des Habitants, du premier arrivé au dernier. */
  const prenoms = async (territoireId: number) => ({
    portes: (await voyageursAuxPortes(pool, territoireId)).map((v) => v.prenom),
    habitants: (await habitantsDuTerritoire(pool, territoireId)).sort((a, b) => a.id - b.id).map((h) => h.prenom),
  });

  beforeAll(async () => {
    pool = poolDeTest();
    base.pool = pool;
    await preparerMondeDeTest(pool);
  });
  afterAll(async () => {
    await pool.query("delete from compte where email like $1", [`${lancement}-%`]);
    await pool.end();
  });

  it("fait du Voyageur un Habitant du joueur, arrivé à l'heure du jeu, et le dit dans un Récit", async () => {
    const joueur = await naitre();
    const ines = await presenter(joueur, "Ines");
    const { habitants: trois } = await prenoms(joueur);
    connecter(joueur);

    const avant = Date.now();
    await accueillirUnVoyageur(ines);
    expect(await prenoms(joueur)).toEqual({ portes: [], habitants: [...trois, "Ines"] });
    const nouveau = (await habitantsDuTerritoire(pool, joueur)).find((h) => h.prenom === "Ines")!;
    expect(nouveau.metier).toBeNull();
    expect(nouveau.arriveLe.getTime()).toBeGreaterThanOrEqual(avant);
    expect(nouveau.arriveLe.getTime()).toBeLessThanOrEqual(Date.now());
    expect((await recitsDuTerritoire(pool, joueur)).map((r) => [r.titre, r.survenuLe])).toEqual([["Ines a rejoint le Territoire", nouveau.arriveLe]]);
  });

  it("n'accueille que les Voyageurs aux portes du joueur connecté, jamais ceux d'un autre, même en envoyant leur identifiant", async () => {
    const [joueur, voisin] = [await naitre(), await naitre()];
    const ines = await presenter(joueur, "Ines");
    const brune = await presenter(voisin, "Brune");
    const [siens, autres] = [await prenoms(joueur), await prenoms(voisin)];
    connecter(joueur);

    await accueillirUnVoyageur(brune);
    expect(await prenoms(voisin)).toEqual(autres);
    expect(await prenoms(joueur)).toEqual(siens);
    expect(await recitsDuTerritoire(pool, voisin)).toEqual([]);

    await accueillirUnVoyageur(ines);
    expect(await prenoms(joueur)).toEqual({ portes: [], habitants: [...siens.habitants, "Ines"] });
    expect(await prenoms(voisin)).toEqual(autres);
  });

  it("rend « reparti » pour un Voyageur parti de lui-même au bout de son attente, sans en faire un Habitant (US-0337)", async () => {
    const joueur = await naitre();
    const { rows } = await pool.query<{ id: number; arrive_le: Date }>(
      "insert into voyageur (territoire_id, prenom, arrive_le) values ($1, 'Ines', now() - interval '13 hours') returning id, arrive_le",
      [joueur],
    );
    await programmerEvenement(pool, "territoire", joueur, departDuVoyageur(rows[0].arrive_le), DEPART_VOYAGEUR, { voyageur: rows[0].id });
    const avant = await prenoms(joueur);
    connecter(joueur);

    // La garde met le Territoire à l'heure : son départ, passé, y est appliqué.
    await rattraper("territoire", joueur, { pool });
    expect(await accueillirUnVoyageur(rows[0].id)).toBe("reparti");
    expect(await prenoms(joueur)).toEqual({ portes: [], habitants: avant.habitants });
    expect((await recitsDuTerritoire(pool, joueur)).map((r) => r.titre)).toEqual(["Ines a repris la route"]);
  });

  it("accueilli deux fois en même temps (deux onglets), le Voyageur ne devient qu'un seul Habitant", async () => {
    const joueur = await naitre();
    const ines = await presenter(joueur, "Ines");
    const { habitants: trois } = await prenoms(joueur);
    connecter(joueur);

    await Promise.all([accueillirUnVoyageur(ines), accueillirUnVoyageur(ines)]);
    expect(await prenoms(joueur)).toEqual({ portes: [], habitants: [...trois, "Ines"] });
    expect(await recitsDuTerritoire(pool, joueur)).toHaveLength(1);
  });

  it("refusé, le Voyageur repart sans devenir Habitant ni laisser de Récit (US-0336)", async () => {
    const joueur = await naitre();
    const ines = await presenter(joueur, "Ines");
    const joran = await presenter(joueur, "Joran");
    const { habitants: trois } = await prenoms(joueur);
    connecter(joueur);

    await refuserUnVoyageur(ines);
    expect(await prenoms(joueur)).toEqual({ portes: ["Joran"], habitants: trois });
    expect(await recitsDuTerritoire(pool, joueur)).toEqual([]);
    expect((await voyageursAuxPortes(pool, joueur)).map((v) => v.id)).toEqual([joran]);
  });

  it("ne refuse que les Voyageurs aux portes du joueur connecté, jamais ceux d'un autre, même en envoyant leur identifiant (US-0336)", async () => {
    const [joueur, voisin] = [await naitre(), await naitre()];
    await presenter(joueur, "Ines");
    const brune = await presenter(voisin, "Brune");
    const [siens, autres] = [await prenoms(joueur), await prenoms(voisin)];
    connecter(joueur);

    await refuserUnVoyageur(brune);
    expect(await prenoms(voisin)).toEqual(autres);
    expect(await prenoms(joueur)).toEqual(siens);
  });

  it("accueilli dans un onglet et refusé dans l'autre en même temps, un seul des deux l'emporte, jamais un Habitant en double (US-0336)", async () => {
    const joueur = await naitre();
    const { habitants: trois } = await prenoms(joueur);
    connecter(joueur);
    for (let essai = 0; essai < 4; essai++) {
      const ines = await presenter(joueur, "Ines");
      await Promise.all(essai % 2 ? [accueillirUnVoyageur(ines), refuserUnVoyageur(ines)] : [refuserUnVoyageur(ines), accueillirUnVoyageur(ines)]);
      expect((await prenoms(joueur)).portes, `essai ${essai}`).toEqual([]);
    }
    // Chaque accueil qui l'a emporté a donné un Habitant et son Récit ; chaque refus, rien.
    const accueils = (await recitsDuTerritoire(pool, joueur)).length;
    expect(await prenoms(joueur)).toEqual({ portes: [], habitants: [...trois, ...Array.from({ length: accueils }, () => "Ines")] });
  });
});
