"use server";

import { redirect } from "next/navigation";
import { exigerCompte, PAGE_ARRIVEE } from "@/comptes/garde";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { getPool } from "@/db";
import { marquerRecitLu } from "@/monde/territoire";
import { maintenant } from "@/temps/horloge";

/**
 * « Entrer dans mon Foyer » (US-0158) : le récit d'arrivée est noté comme lu à ce moment, et
 * seulement à ce moment. Le noter dès l'affichage le perdait quand Next calculait la page deux
 * fois (après une connexion suivie d'une redirection, US-0160).
 */
export async function entrerDansLeFoyer(): Promise<void> {
  if (!entreeDuJeuOuverte()) return;
  const { territoireId } = await exigerCompte(PAGE_ARRIVEE);
  if (territoireId !== null) await marquerRecitLu(getPool(), territoireId, maintenant());
  redirect("/jeu");
}
