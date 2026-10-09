"use server";

import { refresh } from "next/cache";
import { exigerCompte } from "@/comptes/garde";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { getPool } from "@/db";
import { rappelerLExpedition } from "@/expeditions/rappel";
import { maintenant } from "@/temps/horloge";

/** Le plus grand identifiant qu'une colonne integer de Postgres puisse tenir. */
const IDENTIFIANT_MAX = 2_147_483_647;

/**
 * US-0920 : « Rappeler » : le joueur rappelle une de ses Expéditions, depuis sa ligne dans la liste des Expéditions en
 * cours ou sa fiche sur la carte. Le Territoire vient de la garde, jamais du navigateur : une Expédition d'un autre
 * Territoire n'est pas touchée, quel que soit l'identifiant envoyé ; l'heure du rappel est celle du jeu. La page est
 * ensuite relue, même quand le rappel est refusé (déjà au retour, ou rentrée) : c'est elle qui fait foi.
 */
export async function rappeler(expeditionId: number): Promise<void> {
  if (!entreeDuJeuOuverte()) return;
  const { territoireId } = await exigerCompte("/jeu/expeditions");
  if (territoireId === null || !Number.isInteger(expeditionId) || expeditionId <= 0 || expeditionId > IDENTIFIANT_MAX) return;
  await rappelerLExpedition(getPool(), territoireId, expeditionId, maintenant());
  refresh();
}
