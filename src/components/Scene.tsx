"use client";

import { usePathname, useRouter } from "next/navigation";
import { type ComponentProps, useCallback } from "react";
import { CarteDuJeu } from "@/app/jeu/carte/CarteDuJeu";
import { PAGE_CARTE } from "./entrees-du-jeu";
import styles from "./Scene.module.css";

/**
 * La scène du jeu : la carte du Monde, qui reste sous toutes les pages du jeu, le Territoire, le brouillard et les
 * Expéditions en route toujours en vue. Chaque page s'ouvre par-dessus dans un volet (Volet) ; la carte se voit à côté
 * sur ordinateur, au-dessus sur un téléphone, et le milieu de ce qu'on en voit est le milieu de la carte. Sur la page de
 * la Carte, c'est la page qui la montre, en entier, avec ses boutons : la scène s'efface.
 *
 * Toucher la scène ferme le volet et ramène à la carte. Elle ne fait que montrer : la mise en page du jeu
 * (src/app/jeu/layout.tsx) lui donne le Monde que la carte lit.
 */
export function Scene(proprietes: Omit<ComponentProps<typeof CarteDuJeu>, "quitter" | "destination">) {
  const page = usePathname();
  const routeur = useRouter();
  const quitter = useCallback(() => routeur.push(PAGE_CARTE), [routeur]);
  if (page === PAGE_CARTE) return null;
  return (
    <div className={styles.scene} data-scene="">
      <div className={styles.monde}>
        <CarteDuJeu {...proprietes} quitter={quitter} />
      </div>
      <div className={styles.lumiere} aria-hidden="true" />
    </div>
  );
}
