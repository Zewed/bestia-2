"use client";

import Link from "next/link";
import { useHabitantsMontres } from "./HabitantsMontres";
import styles from "./page.module.css";

/** US-0313 : « 1 Habitant sans Métier », « 2 Habitants sans Métier ». */
const sansMetierEnMots = (nombre: number) => `${nombre} ${nombre > 1 ? "Habitants" : "Habitant"} sans Métier`;

/**
 * US-0313 : en haut de la page Habitants, sous le titre, le nombre d'Habitants sans Métier et « Voir », qui mène
 * à la liste filtrée sur eux (US-0314). Compté sur les Habitants que montre la liste (HabitantsMontres) : il baisse
 * dès qu'un Métier est donné et s'en va avec le dernier, sans recharger la page.
 */
export function BandeauSansMetier() {
  const [montres] = useHabitantsMontres();
  const sansMetier = montres.filter((h) => h.metier === null).length;
  if (sansMetier === 0) return null;
  return (
    <p className={styles.sansMetier}>
      <strong className={styles.nombreSansMetier}>{sansMetierEnMots(sansMetier)}</strong>
      <Link href="/jeu/habitants?metier=sans" className={styles.voirSansMetier}>
        Voir
      </Link>
    </p>
  );
}
