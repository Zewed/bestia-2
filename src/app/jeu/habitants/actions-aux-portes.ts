"use server";

import { refresh } from "next/cache";
import { exigerCompte } from "@/comptes/garde";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { getPool } from "@/db";
import { type Accueil, accueillirLeVoyageur, refuserLeVoyageur } from "@/monde/voyageurs";
import { maintenant } from "@/temps/horloge";

/** Le plus grand identifiant qu'une colonne integer de Postgres puisse tenir. */
const IDENTIFIANT_MAX = 2_147_483_647;

/** US-0335 : l'identifiant d'un Métier, écrit comme dans donnees/ (minuscules sans accent), et pas plus long qu'il n'en faut. */
const IDENTIFIANT_DE_METIER = /^[a-z0-9_]{1,64}$/;

/** Vrai pour un identifiant que la colonne integer d'un Voyageur peut tenir. */
function identifiantValable(voyageurId: number): boolean {
  return Number.isInteger(voyageurId) && voyageurId > 0 && voyageurId <= IDENTIFIANT_MAX;
}

/** US-0335 : vrai pour aucun Métier (null), ou pour un identifiant de Métier écrit comme dans donnees/. */
function metierValable(metierId: string | null): boolean {
  return metierId === null || (typeof metierId === "string" && IDENTIFIANT_DE_METIER.test(metierId));
}

/**
 * US-0334 : le joueur accueille un Voyageur qui attend aux portes : il devient un Habitant sans Métier, à
 * l'heure du jeu, gratuitement, et un Récit le dit. La garde a mis le Territoire à l'heure : l'Entretien d'avant
 * l'accueil est payé au nombre d'Habitants d'avant, et un Voyageur dont l'attente s'est achevée entre-temps est
 * déjà reparti (US-0337). Le Territoire vient de la garde, jamais du navigateur : un Voyageur d'un autre Territoire
 * n'est pas touché, quel que soit l'identifiant envoyé. La page est ensuite relue, même quand le Voyageur
 * n'attendait plus : c'est elle qui fait foi, à la place de la ligne retirée d'avance. US-0337 : rend ce qu'a donné
 * l'accueil, pour que la page dise pourquoi un Voyageur déjà reparti n'a pas été accueilli.
 *
 * US-0335 : avec le Métier choisi sur sa ligne (`metierId`, null : sans Métier), que le nouvel Habitant exerce
 * aussitôt ; l'accueil vérifie, dans sa transaction, que c'est l'un des huit. Un identifiant mal écrit n'accueille
 * personne.
 */
export async function accueillirUnVoyageur(voyageurId: number, metierId: string | null = null): Promise<Accueil | undefined> {
  if (!entreeDuJeuOuverte()) return;
  const { territoireId } = await exigerCompte("/jeu/habitants");
  if (territoireId === null || !identifiantValable(voyageurId) || !metierValable(metierId)) return;
  const accueil = await accueillirLeVoyageur(getPool(), territoireId, voyageurId, maintenant(), metierId);
  refresh();
  return accueil;
}

/**
 * US-0336 : le joueur refuse un Voyageur qui attend aux portes : il repart aussitôt, à l'heure du jeu, sans Récit,
 * et ne revient pas ; sa place aux portes se libère pour le suivant. Mêmes gardes que pour l'accueil : un Voyageur
 * d'un autre Territoire n'est pas touché, et la page relue fait foi, même quand le Voyageur n'attendait plus.
 */
export async function refuserUnVoyageur(voyageurId: number): Promise<void> {
  if (!entreeDuJeuOuverte()) return;
  const { territoireId } = await exigerCompte("/jeu/habitants");
  if (territoireId === null || !identifiantValable(voyageurId)) return;
  await refuserLeVoyageur(getPool(), territoireId, voyageurId, maintenant());
  refresh();
}
