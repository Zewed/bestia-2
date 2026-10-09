"use client";

import { DetailDeLExpedition } from "@/components/DetailDeLExpedition";
import type { ExpeditionEnCours } from "@/expeditions/en-cours";
import { useHeureDuJeu } from "@/temps/heure-du-jeu";
import styles from "./page.module.css";

/**
 * US-0918 : la liste des Expéditions en cours, de la première partie à la dernière, chacune avec son détail : leurs
 * phases et leurs comptes à rebours avancent ensemble, sans recharger la page, à l'heure du jeu partie de `maintenant`
 * et au rythme du jeu (`vitesse`). Sur un téléphone, chacune tient sur une ligne qu'on déplie pour voir le détail.
 */
export function ListeDesExpeditions({ expeditions, maintenant, vitesse = 1 }: { expeditions: ExpeditionEnCours[]; maintenant: Date; vitesse?: number }) {
  const instant = useHeureDuJeu(maintenant, vitesse);
  return (
    <ul className={styles.expeditions}>
      {expeditions.map((expedition) => (
        <li key={expedition.id}>
          <DetailDeLExpedition expedition={expedition} instant={instant} repliable />
        </li>
      ))}
    </ul>
  );
}
