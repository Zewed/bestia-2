"use server";

import { exigerCompte } from "@/comptes/garde";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { getPool } from "@/db";
import { noterLaPresence } from "@/monde/absence";
import { maintenant } from "@/temps/horloge";

/**
 * US-0216 : le joueur a une page du jeu ouverte. Appelée par le navigateur une fois la page
 * affichée, et non pendant son calcul : Next peut calculer une page deux fois, et le récapitulatif
 * d'absence serait perdu avant d'être montré. La garde met d'abord le Territoire à l'heure.
 */
export async function noterMaPresence(): Promise<void> {
  if (!entreeDuJeuOuverte()) return;
  const { territoireId } = await exigerCompte();
  if (territoireId !== null) await noterLaPresence(getPool(), territoireId, maintenant());
}
