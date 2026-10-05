"use server";

import { nomDejaPris, nomInterdit } from "@/chefs/chef";
import { NOM_DEJA_PRIS, NOM_NON_AUTORISE, nettoyerNom, verifierNomDeChef } from "@/chefs/nom";
import { exigerCompteSansChef } from "@/comptes/garde";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { getPool } from "@/db";

/**
 * Si le nom est interdit (US-0138) ou déjà porté dans le Monde (US-0135) : le message à afficher,
 * ou null. Un nom interdit ne dit pas s'il est pris. Un nom qui enfreint une autre règle n'est pas
 * cherché, le navigateur le refuse déjà. Ne réserve rien : l'enregistrement vérifiera encore.
 */
export async function verifierNomLibre(saisie: string): Promise<string | null> {
  if (!entreeDuJeuOuverte()) return null;
  await exigerCompteSansChef();
  const nom = nettoyerNom(String(saisie));
  if (verifierNomDeChef(nom)) return null;
  if (await nomInterdit(getPool(), nom)) return NOM_NON_AUTORISE;
  return (await nomDejaPris(getPool(), nom)) ? NOM_DEJA_PRIS : null;
}
