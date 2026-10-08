// Le Monde du jeu, et la bascule vers un Monde généré (US-0414). Côté serveur et scripts uniquement.
import type { PoolClient } from "pg";
import { abordsDuFoyer, decouvrir } from "./brouillard";
import { choisirCaseDeNaissance, emplacementsDeFoyers, type CaseCandidate } from "./foyers";
import type { Coordonnees } from "./hex";

/**
 * Le Monde du jeu (US-0414) : le Monde ouvert et pas encore fermé, un seul à la fois (la base y veille), où
 * naissent les chefs. Aube l'est depuis sa naissance, jusqu'à ce qu'une bascule en ouvre un autre.
 */
export const MONDE_DU_JEU = "(select id from monde where ouvert_le is not null and ferme_le is null)";

/**
 * La clé du verrou des naissances : une naissance à la fois dans le jeu. La bascule le prend aussi : aucun chef ne
 * naît pendant qu'elle installe les autres, et une naissance qui l'attendait vise ensuite le nouveau Monde du jeu.
 */
export const VERROU_DES_NAISSANCES = 153;

export type Bascule = {
  depuis: string;
  vers: string;
  /** Chaque chef qui avait un Foyer, avec sa Case d'avant et celle qu'il a reçue, dans l'ordre de leurs naissances. */
  foyers: { chef: string; avant: Coordonnees; apres: Coordonnees }[];
  /** Les chefs encore sans Foyer (US-0160), qui recevront le leur à leur retour. */
  sansFoyer: number;
  /** Les places de Foyer qui restent ensuite, estimées comme pour l'alerte de l'équipe (US-0159). */
  restantes: number;
};

/**
 * Fait du Monde `vers` (son nom ou son numéro) le Monde du jeu, dans la transaction de l'appelant (US-0414), et
 * ferme l'ancien. Chaque chef y reçoit un Foyer sur une Case de naissance libre de la Couronne, selon les règles de
 * US-0413 (en prairie, à ECART_ENTRE_FOYERS Cases des autres), dans l'ordre de leurs naissances et comme elles :
 * près du dernier arrivé. Son Territoire est rattaché à cette Case, rien d'autre ne change : Stocks, Habitants,
 * Voyageurs, Récits et marque-page restent les siens, et sa production continue aussi, une prairie pour une
 * prairie. US-0436 : sur le nouveau Monde, chaque Territoire ne découvre que les abords de son nouveau Foyer ; ce
 * qu'il avait découvert de l'ancien reste à lui, sans plus se montrer. Un chef encore sans Foyer (US-0160) recevra
 * le sien à son retour, comme une naissance. Refuse, avant
 * d'écrire quoi que ce soit, un Monde qui a déjà été ouvert, qui compte déjà des chefs, qui n'est pas généré en
 * entier, ou qui n'a pas la place de tous les chefs.
 */
export async function basculerLeMonde(client: PoolClient, vers: string, hasard: () => number = Math.random): Promise<Bascule> {
  await client.query("select pg_advisory_xact_lock($1)", [VERROU_DES_NAISSANCES]);
  // « for no key update », comme la préparation de la Couronne : une seule des deux touche un Monde à la fois.
  const { rows: jeu } = await client.query<{ id: number; nom: string }>(`select id, nom from monde where id = ${MONDE_DU_JEU} for no key update`);
  if (!jeu[0]) throw new Error("Aucun Monde n'est ouvert.");
  const { rows: cibles } = await client.query<{ id: number; nom: string; ouvert: boolean; habite: boolean; enEntier: boolean }>(
    `select m.id, m.nom, m.ouvert_le is not null as ouvert, exists (select 1 from chef where monde_id = m.id) as habite,
       coalesce((select count(*) from case_du_monde where monde_id = m.id) = 3 * m.rayon * (m.rayon + 1) + 1, false) as "enEntier"
     from monde m where m.nom = $1 or m.id::text = $1 order by m.nom = $1 desc limit 1 for no key update`,
    [vers],
  );
  const cible = cibles[0];
  if (!cible) throw new Error(`Aucun Monde ne s'appelle « ${vers} » ni ne porte ce numéro.`);
  if (cible.ouvert) throw new Error(`Le Monde « ${cible.nom} » a déjà été ouvert : une bascule n'ouvre qu'un Monde neuf.`);
  if (cible.habite) throw new Error(`Le Monde « ${cible.nom} » compte déjà des chefs.`);
  if (!cible.enEntier) throw new Error(`Le Monde « ${cible.nom} » n'est pas généré en entier : générez-en un avec npm run monde:generer.`);

  const { rows: chefs } = await client.query<{ id: number; nom: string; foyer: Coordonnees | null; cases: number }>(
    `select ch.id, ch.nom, case when c.id is not null then json_build_object('q', c.q, 'r', c.r) end as foyer,
       (select count(*)::int from case_du_monde where chef_id = ch.id) as cases
     from chef ch left join territoire t on t.chef_id = ch.id left join case_du_monde c on c.id = t.foyer_case_id
     where ch.monde_id = $1 order by ch.cree_le, ch.id`,
    [jeu[0].id],
  );
  // Seul le Foyer suit son chef : un Territoire qui aurait grandi perdrait ses autres Cases, et leur production.
  const grandi = chefs.find((ch) => ch.cases !== (ch.foyer ? 1 : 0));
  if (grandi) throw new Error(`Le Territoire de « ${grandi.nom} » compte d'autres Cases que son Foyer : il ne sait pas encore changer de Monde.`);
  const { rows: libres } = await client.query<CaseCandidate & { id: number }>(
    "select id, q, r, biome_id as biome, coeur from case_du_monde where monde_id = $1 and couronne and biome_id = 'prairie' and chef_id is null",
    [cible.id],
  );
  const avecFoyer = chefs.filter((ch) => ch.foyer);
  const sansFoyer = chefs.length - avecFoyer.length;
  const pasLaPlace = new Error(`Le Monde « ${cible.nom} » n'a pas la place des ${chefs.length} chefs d'« ${jeu[0].nom} » : rien n'a changé.`);
  // Chaque Foyer naît près de celui d'avant, comme à une naissance (US-0153).
  const nouvelles: (CaseCandidate & { id: number })[] = [];
  while (nouvelles.length < avecFoyer.length) {
    const choisie = choisirCaseDeNaissance(libres, nouvelles, nouvelles.at(-1) ?? null, hasard);
    if (!choisie) throw pasLaPlace;
    nouvelles.push(choisie);
  }
  const restantes = emplacementsDeFoyers(libres.filter((c) => !nouvelles.includes(c)), nouvelles).length;
  if (restantes < sansFoyer) throw pasLaPlace;

  await client.query("update case_du_monde set chef_id = null, imprenable = false where monde_id = $1 and chef_id is not null", [jeu[0].id]);
  const paires = [avecFoyer.map((ch) => ch.id), nouvelles.map((c) => c.id)];
  const { rowCount } = await client.query(
    `update case_du_monde c set chef_id = p.chef, imprenable = true from unnest($1::int[], $2::int[]) as p(chef, case_id)
     where c.id = p.case_id and c.chef_id is null`,
    paires,
  );
  if (rowCount !== avecFoyer.length) throw new Error(`Des Cases d'« ${cible.nom} » n'étaient plus libres.`);
  const { rows: rattaches } = await client.query<{ id: number; chef: number }>(
    "update territoire t set foyer_case_id = p.case_id from unnest($1::int[], $2::int[]) as p(chef, case_id) where t.chef_id = p.chef returning t.id, p.chef",
    paires,
  );
  // US-0436 : sur le nouveau Monde, chaque Territoire ne découvre que les abords de son nouveau Foyer, comme à une naissance.
  for (const t of rattaches) await decouvrir(client, t.id, abordsDuFoyer(nouvelles[avecFoyer.findIndex((ch) => ch.id === t.chef)]));
  await client.query("update chef set monde_id = $2 where monde_id = $1", [jeu[0].id, cible.id]);
  // L'ancien Monde est fermé avant que le nouveau ouvre : la base n'en accepte jamais deux ouverts.
  await client.query("update monde set ferme_le = now() where id = $1", [jeu[0].id]);
  await client.query("update monde set ouvert_le = now() where id = $1", [cible.id]);
  return {
    depuis: jeu[0].nom,
    vers: cible.nom,
    foyers: avecFoyer.map((ch, i) => ({ chef: ch.nom, avant: ch.foyer!, apres: { q: nouvelles[i].q, r: nouvelles[i].r } })),
    sansFoyer,
    restantes,
  };
}
