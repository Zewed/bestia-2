"use client";

import { createContext, type ReactNode, use, useOptimistic } from "react";
import type { HabitantAffiche } from "./ListeDesHabitants";

/**
 * US-0308 : un Métier donné à un Habitant, montré d'avance le temps que l'action l'enregistre ; US-0311 : null
 * quand il le perd.
 */
export type MetierDonne = { id: number; metier: string | null };

/** Les Habitants montrés, Métiers donnés d'avance compris, et de quoi en donner un d'avance. */
type Montres = readonly [HabitantAffiche[], (donne: MetierDonne) => void];

/**
 * US-0311 : vrai quand `a` passe avant `b` parmi les sans Métier, dans l'ordre de la lecture : par prénom, puis le
 * premier arrivé. Les prénoms (une majuscule, puis des minuscules sans accent) se comparent comme la base les range.
 */
const avant = (a: HabitantAffiche, b: HabitantAffiche) => (a.prenom === b.prenom ? a.id < b.id : a.prenom < b.prenom);

/**
 * Les Habitants, le Métier donné d'avance posé sur la ligne de celui qui le reçoit, qui reste à sa place jusqu'à la
 * page relue. US-0311 : remis sans Métier, il remonte aussitôt parmi les sans Métier, à la place que la lecture lui
 * donnera, ou en tête quand il n'y en a pas d'autre.
 */
function avecLeMetierDonne(actuels: HabitantAffiche[], donne: MetierDonne): HabitantAffiche[] {
  const habitant = actuels.find((h) => h.id === donne.id);
  if (!habitant) return actuels;
  const change = { ...habitant, metier: donne.metier };
  if (donne.metier !== null || habitant.metier === null) return actuels.map((h) => (h.id === donne.id ? change : h));
  const autres = actuels.filter((h) => h.id !== donne.id);
  const suivant = autres.findIndex((h) => h.metier === null && avant(change, h));
  const place = suivant >= 0 ? suivant : autres.findLastIndex((h) => h.metier === null) + 1;
  return [...autres.slice(0, place), change, ...autres.slice(place)];
}

const Partages = createContext<Montres | null>(null);

/**
 * US-0313 : les Habitants de la page, partagés par la liste (ListeDesHabitants) et le bandeau des sans Métier
 * (BandeauSansMetier) : un Métier donné depuis la liste se voit aussitôt dans les deux, le temps que l'action
 * l'enregistre et relise la page, qui fait alors foi (US-0308).
 */
export function HabitantsMontres({ habitants, children }: { habitants: HabitantAffiche[]; children: ReactNode }) {
  const montres = useOptimistic(habitants, avecLeMetierDonne);
  return <Partages value={montres}>{children}</Partages>;
}

/**
 * Les Habitants que montre la page, Métiers donnés d'avance compris, et de quoi en donner un d'avance. Hors de
 * HabitantsMontres, ceux de `habitants`, tenus sur place : une liste seule garde ainsi les siens.
 */
export function useHabitantsMontres(habitants: HabitantAffiche[] = []): Montres {
  const surPlace = useOptimistic(habitants, avecLeMetierDonne);
  return use(Partages) ?? surPlace;
}
