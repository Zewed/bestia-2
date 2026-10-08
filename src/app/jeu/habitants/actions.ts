"use server";

import { refresh } from "next/cache";
import { exigerCompte } from "@/comptes/garde";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { getPool } from "@/db";
import { ajouterUnHabitantAuMetier, enregistrerLeMetier, renvoyerLHabitant, retirerUnHabitantDuMetier } from "@/monde/habitants";
import { maintenant } from "@/temps/horloge";

/** Le plus grand identifiant qu'une colonne integer de Postgres puisse tenir. */
const IDENTIFIANT_MAX = 2_147_483_647;

/** L'identifiant d'un Métier, écrit comme dans donnees/ (minuscules sans accent), et pas plus long qu'il n'en faut. */
const IDENTIFIANT_DE_METIER = /^[a-z0-9_]{1,64}$/;

/** Vrai pour un identifiant que la colonne integer d'un Habitant peut tenir. */
function identifiantValable(habitantId: number): boolean {
  return Number.isInteger(habitantId) && habitantId > 0 && habitantId <= IDENTIFIANT_MAX;
}

/** Vrai pour un identifiant de Métier écrit comme dans donnees/. */
function metierValable(metierId: string): boolean {
  return typeof metierId === "string" && IDENTIFIANT_DE_METIER.test(metierId);
}

/**
 * US-0308 : le joueur donne un Métier à un Habitant sans Métier, gratuitement et aussitôt ; US-0310 : ou en
 * donne un autre à un Habitant qui en a un, de la même façon. Le Territoire vient de la garde, jamais du
 * navigateur : un Habitant d'un autre Territoire n'est pas touché, quel que soit l'identifiant envoyé. La
 * page est ensuite relue, même quand rien n'a changé (Habitant d'un autre, Métier inconnu) : c'est elle qui
 * fait foi, à la place du Métier montré d'avance.
 */
export async function donnerUnMetier(habitantId: number, metierId: string): Promise<void> {
  if (!entreeDuJeuOuverte()) return;
  const { territoireId } = await exigerCompte("/jeu/habitants");
  if (territoireId === null || !identifiantValable(habitantId) || !metierValable(metierId)) return;
  await enregistrerLeMetier(getPool(), territoireId, habitantId, metierId);
  refresh();
}

/**
 * US-0311 : le joueur remet sans Métier un Habitant qui en a un, gratuitement et aussitôt, comme il le
 * changerait. Mêmes gardes que pour le donner : un Habitant d'un autre Territoire n'est pas touché, et la page
 * relue fait foi, même quand rien n'a changé.
 */
export async function retirerLeMetier(habitantId: number): Promise<void> {
  if (!entreeDuJeuOuverte()) return;
  const { territoireId } = await exigerCompte("/jeu/habitants");
  if (territoireId === null || !identifiantValable(habitantId)) return;
  await enregistrerLeMetier(getPool(), territoireId, habitantId, null);
  refresh();
}

/**
 * US-0312 : « + » d'un Métier : le joueur le donne à un Habitant sans Métier, que la base choisit (le premier de
 * la liste), jamais le navigateur. Mêmes gardes : seuls les Habitants du joueur sont touchés, et la page relue
 * fait foi, même quand il ne restait plus personne sans Métier.
 */
export async function ajouterAuMetier(metierId: string): Promise<void> {
  if (!entreeDuJeuOuverte()) return;
  const { territoireId } = await exigerCompte("/jeu/habitants");
  if (territoireId === null || !metierValable(metierId)) return;
  await ajouterUnHabitantAuMetier(getPool(), territoireId, metierId);
  refresh();
}

/**
 * US-0312 : « − » d'un Métier : le joueur remet sans Métier un Habitant qui l'exerce, que la base choisit (le
 * dernier arrivé). Mêmes gardes, et la page relue fait foi, même quand plus personne ne l'exerçait.
 */
export async function retirerDuMetier(metierId: string): Promise<void> {
  if (!entreeDuJeuOuverte()) return;
  const { territoireId } = await exigerCompte("/jeu/habitants");
  if (territoireId === null || !metierValable(metierId)) return;
  await retirerUnHabitantDuMetier(getPool(), territoireId, metierId);
  refresh();
}

/**
 * US-0330 : le joueur renvoie un Habitant, une fois le renvoi confirmé sur sa ligne : il quitte le Territoire pour de
 * bon, à l'heure du jeu, et un Récit le dit. La garde a mis le Territoire à l'heure : l'Entretien d'avant le renvoi est
 * payé au nombre d'Habitants d'avant. Mêmes gardes que pour un Métier : un Habitant d'un autre Territoire n'est pas
 * touché, et la page relue fait foi, à la place de la ligne retirée d'avance, même quand personne n'est parti.
 */
export async function renvoyerUnHabitant(habitantId: number): Promise<void> {
  if (!entreeDuJeuOuverte()) return;
  const { territoireId } = await exigerCompte("/jeu/habitants");
  if (territoireId === null || !identifiantValable(habitantId)) return;
  await renvoyerLHabitant(getPool(), territoireId, habitantId, maintenant());
  refresh();
}
