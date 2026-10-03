"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { temoinDeConnexion } from "@/comptes/temoin";
import styles from "./page.module.css";

const rienAEcouter = () => () => {};

/**
 * L'entrée du jeu sur la page d'accueil (US-0101) : « Créer un compte » et « Se connecter » ;
 * pour un joueur déjà connecté, « Retourner au jeu » (US-0122). La page reste statique : c'est
 * le navigateur qui lit le témoin de connexion.
 */
export function EntreeDuJeu() {
  const connecte = useSyncExternalStore(
    rienAEcouter,
    () => temoinDeConnexion(document.cookie),
    () => false,
  );
  return (
    <div className={styles.entree}>
      {connecte ? (
        <Link href="/jeu" className={styles.principal}>
          Retourner au jeu
        </Link>
      ) : (
        <>
          <Link href="/inscription" className={styles.principal}>
            Créer un compte
          </Link>
          <Link href="/connexion" className={styles.secondaire}>
            Se connecter
          </Link>
        </>
      )}
    </div>
  );
}
