"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { avantFamineImminente, nourritureRestante, tenueDeLaNourriture } from "@/monde/nourriture";
import styles from "./BarreHaut.module.css";

/** Le plus long délai qu'un minuteur du navigateur sache attendre : au-delà, il partirait aussitôt. */
const DELAI_MAX_MS = 2_147_483_647;

/**
 * US-0321 : l'avertissement « famine imminente », une bande d'alerte toute la largeur au bas de la barre du
 * haut, sur toutes les pages du jeu : « Famine imminente », le temps que la Nourriture tiendra encore et
 * « Voir » ; toute la bande mène à la page Habitants. Il paraît quand la Nourriture ne couvre plus que
 * FAMINE_IMMINENTE_HEURES heures d'Entretien.
 *
 * `heures` : ce temps-là, compté par le serveur sur les Stocks et l'Entretien lus à l'heure. Page ouverte, il
 * baisse en direct au rythme du jeu (`vitesse`), sur l'horloge du navigateur comme les quantités de la barre
 * (US-0213) ; la bande paraît à l'instant même où il passe le seuil, même en temps accéléré, sans attendre le
 * battement suivant. De nouvelles valeurs arrivent avec une nouvelle clé (ActionsDuJeu) : tout repart d'elles.
 */
export function FamineImminente({ heures, vitesse = 1 }: { heures: number; vitesse?: number }) {
  // Le temps réel écoulé depuis l'arrivée des valeurs du serveur.
  const [ecoule, setEcoule] = useState(0);
  const bascule = avantFamineImminente(heures, vitesse);

  useEffect(() => {
    const depart = performance.now();
    const battement = setInterval(() => setEcoule(performance.now() - depart), 1000);
    // À l'instant où la Nourriture passe le seuil, jamais avant : le navigateur arrondit le délai d'un minuteur à la
    // milliseconde inférieure, et son horloge peut devancer d'un rien celle de la page.
    const apparition =
      bascule > 0 && bascule <= DELAI_MAX_MS ? setTimeout(() => setEcoule(Math.max(bascule, performance.now() - depart)), Math.ceil(bascule)) : undefined;
    return () => {
      clearInterval(battement);
      clearTimeout(apparition);
    };
  }, [bascule]);

  if (ecoule < bascule) return null;
  return (
    <Link href="/jeu/habitants" className={styles.famine} data-alerte-famine="">
      {/* Des espaces entre les morceaux, pour qu'un lecteur d'écran ne les colle pas. */}
      <strong className={styles.titreFamine}>Famine imminente</strong>{" "}
      <span className={styles.tenueFamine}>{tenueDeLaNourriture(nourritureRestante(heures, ecoule, vitesse))}</span>{" "}
      <span className={styles.voirFamine}>Voir</span>
    </Link>
  );
}
