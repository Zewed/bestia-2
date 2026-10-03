"use client";

import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { seDeconnecter } from "@/comptes/deconnexion";
import styles from "./BarreHaut.module.css";
import { rechargerVers } from "./recharger";

/**
 * Les actions du joueur dans la barre du haut, sur les pages du jeu seulement : elles exigent
 * d'être connecté, et la page d'accueil reste ainsi statique et rapide. Pour l'instant :
 * « Se déconnecter » (US-0120).
 */
export function ActionsJoueur() {
  const chemin = usePathname();
  const [enCours, demarrer] = useTransition();
  if (!chemin?.startsWith("/jeu")) return null;

  function deconnecter() {
    demarrer(async () => {
      await seDeconnecter();
      // Un rechargement complet, pas une navigation interne : le navigateur oublie les pages du jeu,
      // et le bouton Précédent ne peut plus les réafficher.
      rechargerVers("/");
    });
  }

  return (
    <button type="button" className={styles.action} onClick={deconnecter} disabled={enCours}>
      {enCours ? "Déconnexion…" : "Se déconnecter"}
    </button>
  );
}
