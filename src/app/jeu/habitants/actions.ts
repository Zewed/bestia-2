"use server";

import { refresh } from "next/cache";
import { exigerCompte } from "@/comptes/garde";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { getPool } from "@/db";
import { enregistrerLeMetier } from "@/monde/habitants";

/** Le plus grand identifiant qu'une colonne integer de Postgres puisse tenir. */
const IDENTIFIANT_MAX = 2_147_483_647;

/** L'identifiant d'un Métier, écrit comme dans donnees/ (minuscules sans accent), et pas plus long qu'il n'en faut. */
const IDENTIFIANT_DE_METIER = /^[a-z0-9_]{1,64}$/;

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
  if (territoireId === null || !Number.isInteger(habitantId) || habitantId <= 0 || habitantId > IDENTIFIANT_MAX) return;
  if (typeof metierId !== "string" || !IDENTIFIANT_DE_METIER.test(metierId)) return;
  await enregistrerLeMetier(getPool(), territoireId, habitantId, metierId);
  refresh();
}
