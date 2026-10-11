"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { entreeDeLaPage, PAGE_CARTE } from "./entrees-du-jeu";
import { Medaillon } from "./Medaillon";
import styles from "./Volet.module.css";

/**
 * Le volet du jeu : chaque page du jeu autre que la Carte s'ouvre dedans, par-dessus la carte du Monde, qui reste en
 * vue (Scene) : à gauche sur ordinateur, monté du bas sur un téléphone, la carte au-dessus. À son coin, le médaillon de
 * la page, celui de son entrée dans la navigation ; sa croix le ferme et ramène à la carte. Le volet défile seul ; le
 * premier titre de la page devient sa plaque de bois (Volet.module.css). Sur la page de la Carte, il n'y a pas de volet.
 */
export function Volet({ children }: { children: ReactNode }) {
  const page = usePathname();
  if (page === PAGE_CARTE) return children;
  return (
    <div className={styles.volet} data-volet="">
      <Medaillon entree={entreeDeLaPage(page)} grand />
      <Link href={PAGE_CARTE} className={styles.fermer} aria-label="Fermer le volet" title="Retour à la carte">
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
        </svg>
      </Link>
      <div className={styles.defilant}>{children}</div>
    </div>
  );
}
