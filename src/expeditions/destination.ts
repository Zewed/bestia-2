// La destination d'une Expédition (US-0907). Côté serveur uniquement.
import "server-only";
import type { Pool, PoolClient } from "pg";
import { type Fiche, type FicheInconnue, ficheDUneCase } from "@/monde/fiche";
import type { Coordonnees } from "@/monde/hex";
import { PORTEE_D_EXPLORATION_CASES } from "@/reglages";
import { CASE_D_UN_TERRITOIRE, CASE_HORS_DE_PORTEE } from "./choix-de-destination";

/**
 * US-0907 : la Case choisie pour destination : sa fiche, telle que le joueur la voit (son Biome, qu'il ne connaît pas
 * sous le brouillard, et sa distance au Foyer), ou le refus qu'il lit à la place.
 */
export type Destination = { fiche: Fiche | FicheInconnue } | { refus: string };

/**
 * US-0907 : la Case `c` choisie pour destination d'une Expédition du Territoire, dans le Monde de son Foyer, ou null si
 * ce Monde n'a pas cette Case (ou si le Territoire n'existe pas). Une Case sous le brouillard peut l'être : sa fiche
 * n'en dit que la place et la distance (US-0438). Une Case qui appartient à un Territoire, le sien ou celui d'un autre
 * joueur, est refusée (CASE_D_UN_TERRITOIRE), même sous le brouillard ; le Foyer du joueur l'est toujours. Le Monde se
 * lit depuis le Territoire, jamais depuis ce que le navigateur envoie. US-0908 : une Case à plus de
 * PORTEE_D_EXPLORATION_CASES de son Foyer, la distance de sa fiche, est refusée de même (CASE_HORS_DE_PORTEE), d'où
 * que vienne la demande.
 */
export async function destinationDUneCase(base: Pool | PoolClient, territoireId: number, c: Coordonnees): Promise<Destination | null> {
  const { rows } = await base.query<{ prise: boolean }>(
    `select c.chef_id is not null or c.id = f.id as prise
     from territoire t join case_du_monde f on f.id = t.foyer_case_id
       join case_du_monde c on c.monde_id = f.monde_id and c.q = $2 and c.r = $3
     where t.id = $1`,
    [territoireId, c.q, c.r],
  );
  if (!rows[0]) return null;
  if (rows[0].prise) return { refus: CASE_D_UN_TERRITOIRE };
  const fiche = await ficheDUneCase(base, territoireId, c);
  if (fiche && fiche.distance > PORTEE_D_EXPLORATION_CASES) return { refus: CASE_HORS_DE_PORTEE };
  return fiche && { fiche };
}
