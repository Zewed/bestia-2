"use server";

import { refresh } from "next/cache";
import { exigerCompte } from "@/comptes/garde";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { getPool } from "@/db";
import { accueillirLeVoyageur } from "@/monde/voyageurs";
import { maintenant } from "@/temps/horloge";

/** Le plus grand identifiant qu'une colonne integer de Postgres puisse tenir. */
const IDENTIFIANT_MAX = 2_147_483_647;

/** Vrai pour un identifiant que la colonne integer d'un Voyageur peut tenir. */
function identifiantValable(voyageurId: number): boolean {
  return Number.isInteger(voyageurId) && voyageurId > 0 && voyageurId <= IDENTIFIANT_MAX;
}

/**
 * US-0334 : le joueur accueille un Voyageur qui attend aux portes : il devient un Habitant sans Métier, à
 * l'heure du jeu, gratuitement, et un Récit le dit. La garde a mis le Territoire à l'heure : l'Entretien d'avant
 * l'accueil est payé au nombre d'Habitants d'avant. Le Territoire vient de la garde, jamais du navigateur : un
 * Voyageur d'un autre Territoire n'est pas touché, quel que soit l'identifiant envoyé. La page est ensuite
 * relue, même quand le Voyageur n'attendait plus : c'est elle qui fait foi, à la place de la ligne retirée d'avance.
 */
export async function accueillirUnVoyageur(voyageurId: number): Promise<void> {
  if (!entreeDuJeuOuverte()) return;
  const { territoireId } = await exigerCompte("/jeu/habitants");
  if (territoireId === null || !identifiantValable(voyageurId)) return;
  await accueillirLeVoyageur(getPool(), territoireId, voyageurId, maintenant());
  refresh();
}
