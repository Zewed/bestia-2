"use server";

import { exigerCompte } from "@/comptes/garde";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { getPool } from "@/db";
import { type Decouvertes, decouvertesDuJoueur } from "@/monde/carte";
import { type Fiche, type FicheInconnue, ficheDUneCase } from "@/monde/fiche";
import { coordonneeValable } from "@/monde/hex";

/**
 * US-0428 : la fiche de la Case (q, r) que le joueur a touchée sur la carte, ou null si son Monde ne l'a pas. Le
 * Monde et le Foyer viennent de la garde, jamais du navigateur, qui ne dit que la Case. US-0438 : d'une Case sous son
 * brouillard, seulement « Case inconnue » et sa distance. Rien ne change en base : la page n'est pas relue.
 */
export async function ficheDeLaCase(q: number, r: number): Promise<Fiche | FicheInconnue | null> {
  if (!entreeDuJeuOuverte()) return null;
  const { territoireId } = await exigerCompte("/jeu/carte");
  if (territoireId === null || !coordonneeValable(q) || !coordonneeValable(r)) return null;
  return ficheDUneCase(getPool(), territoireId, { q, r });
}

/**
 * US-0442 : les Cases que le joueur a découvertes, quand il en a découvert d'autres que les `connues` (leur nombre,
 * que sa carte ouverte en sait), pour qu'elle les dessine sans relire tout le Monde ; null sinon. Le Territoire vient
 * de la garde, jamais du navigateur. Rien ne change en base.
 */
export async function decouvertesDepuis(connues: number): Promise<Decouvertes | null> {
  if (!entreeDuJeuOuverte()) return null;
  const { territoireId } = await exigerCompte("/jeu/carte");
  if (territoireId === null || !coordonneeValable(connues) || connues < 0) return null;
  return decouvertesDuJoueur(getPool(), territoireId, connues);
}
