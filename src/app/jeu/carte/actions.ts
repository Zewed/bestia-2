"use server";

import { exigerCompte } from "@/comptes/garde";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { getPool } from "@/db";
import { type Fiche, type FicheInconnue, ficheDUneCase } from "@/monde/fiche";

/** Le plus grand entier qu'une colonne integer de Postgres puisse tenir, d'un côté comme de l'autre de zéro. */
const COORDONNEE_MAX = 2_147_483_647;

/** Vrai pour une coordonnée de Case que la base peut tenir. */
function coordonneeValable(n: number): boolean {
  return Number.isInteger(n) && Math.abs(n) <= COORDONNEE_MAX;
}

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
