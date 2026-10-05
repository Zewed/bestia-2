"use server";

import { nomDejaPris } from "@/chefs/chef";
import { NOM_DEJA_PRIS, nettoyerNom, verifierNomDeChef } from "@/chefs/nom";
import { exigerCompteSansChef } from "@/comptes/garde";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { getPool } from "@/db";

/**
 * Si le nom est déjà porté dans le Monde (US-0135) : le message à afficher, ou null. Un nom qui
 * enfreint une autre règle n'est pas cherché, le navigateur le refuse déjà. Ne réserve rien :
 * l'enregistrement vérifiera encore (US-0137, US-0139).
 */
export async function verifierNomLibre(saisie: string): Promise<string | null> {
  if (!entreeDuJeuOuverte()) return null;
  await exigerCompteSansChef();
  const nom = nettoyerNom(String(saisie));
  if (verifierNomDeChef(nom)) return null;
  return (await nomDejaPris(getPool(), nom)) ? NOM_DEJA_PRIS : null;
}
