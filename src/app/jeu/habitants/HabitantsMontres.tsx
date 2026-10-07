"use client";

import { createContext, type ReactNode, use, useOptimistic } from "react";
import type { HabitantAffiche } from "./ListeDesHabitants";

/** US-0308 : un Métier donné à un Habitant, montré d'avance le temps que l'action l'enregistre. */
export type MetierDonne = { id: number; metier: string };

/** Les Habitants montrés, Métiers donnés d'avance compris, et de quoi en donner un d'avance. */
type Montres = readonly [HabitantAffiche[], (donne: MetierDonne) => void];

/** Les Habitants, le Métier donné d'avance posé sur la ligne de celui qui le reçoit. */
const avecLeMetierDonne = (actuels: HabitantAffiche[], donne: MetierDonne) => actuels.map((h) => (h.id === donne.id ? { ...h, metier: donne.metier } : h));

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
