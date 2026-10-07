"use server";

import { refresh } from "next/cache";
import { exigerCompte } from "@/comptes/garde";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { getPool } from "@/db";
import { marquerUnRecitLu } from "@/monde/recits";
import { maintenant } from "@/temps/horloge";

/** Le plus grand identifiant qu'une colonne integer de Postgres puisse tenir. */
const IDENTIFIANT_MAX = 2_147_483_647;

/**
 * US-0324 : le joueur ouvre un Récit, qui est noté comme lu. Le Territoire vient de la garde, jamais
 * du navigateur : un Récit d'un autre Territoire n'est pas touché, quel que soit l'identifiant envoyé.
 * La page et la barre du haut sont ensuite relues, pour que le nombre de non lus suive.
 */
export async function lireUnRecit(recitId: number): Promise<void> {
  if (!entreeDuJeuOuverte()) return;
  const { territoireId } = await exigerCompte("/jeu/recits");
  if (territoireId === null || !Number.isInteger(recitId) || recitId <= 0 || recitId > IDENTIFIANT_MAX) return;
  if (await marquerUnRecitLu(getPool(), territoireId, recitId, maintenant())) refresh();
}
