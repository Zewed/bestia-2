"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { motDePasseAccepte } from "@/controle/acces";
import { lireQuantite, modificationsPermises } from "@/controle/stocks";
import { getPool } from "@/db";
import { fixerStock } from "@/monde/stocks";
import { rattraper } from "@/temps/rattraper";
import { SAUTS, sauterDansLeTemps, type Saut } from "@/temps/sauter";

export type EtatFixation = { erreur: string | null };

/**
 * US-0208 : fixe un Stock depuis la page de contrôle, en local et sur les prévisualisations
 * seulement. Le Territoire est d'abord mis à l'heure, pour que rien ne se perde ni ne compte deux
 * fois ; chaque changement est noté dans le journal.
 */
export async function fixerUnStock(_avant: EtatFixation, donnees: FormData): Promise<EtatFixation> {
  // Le proxy demande déjà le mot de passe ; l'action vérifie à nouveau, au cas où il serait contourné.
  if (!motDePasseAccepte((await headers()).get("authorization"))) return { erreur: "Accès refusé." };
  if (!modificationsPermises()) return { erreur: "Les stocks ne se modifient pas en production." };
  const territoireId = Number(donnees.get("territoire"));
  const ressourceId = String(donnees.get("ressource") ?? "");
  const quantite = lireQuantite(String(donnees.get("quantite") ?? ""));
  if (!Number.isInteger(territoireId) || territoireId <= 0) return { erreur: "Ce Stock n'existe pas." };
  if (quantite === null) return { erreur: "Un nombre positif, par exemple 1 234,5." };
  await rattraper("territoire", territoireId);
  const fixe = await fixerStock(getPool(), territoireId, ressourceId, quantite);
  if (!fixe) return { erreur: "Ce Stock n'existe pas." };
  console.info(`Contrôle : ${fixe.ressource} de ${fixe.chef} (Territoire ${territoireId}) fixé de ${fixe.avant} à ${fixe.apres}.`);
  refresh();
  return { erreur: null };
}

/** US-0038 : avance l'heure du jeu d'une heure, d'un jour ou d'une semaine, hors production. */
export async function sauter(donnees: FormData): Promise<void> {
  if (!motDePasseAccepte((await headers()).get("authorization"))) return;
  if (!modificationsPermises()) return;
  const saut = String(donnees.get("saut") ?? "");
  if (!(saut in SAUTS)) return;
  const ancre = await sauterDansLeTemps(getPool(), SAUTS[saut as Saut]);
  console.info(`Contrôle : saut dans le temps d'une ${saut === "jour" ? "journée" : saut}, l'heure du jeu est maintenant ${new Date(ancre.jeu).toISOString()}.`);
  refresh();
}
