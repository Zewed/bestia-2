"use client";

import { useEffect, useRef } from "react";
import type { CarteDuJoueur } from "@/monde/carte";
import { dessinerLaCarte, vueSurLeFoyer } from "./dessin";
import styles from "./page.module.css";

/** La couleur que donne une expression CSS sur la page (« var(--trait) »), telle que le <canvas> la comprend. */
function couleurCalculee(element: HTMLElement, expression: string): string {
  element.style.color = expression;
  const couleur = getComputedStyle(element).color;
  element.style.removeProperty("color");
  return couleur;
}

/**
 * US-0417 : la carte du Monde, dessinée sur un <canvas> (10 981 hexagones en SVG pèseraient trop sur une page de
 * jeu), dans toute la place que la page lui donne et nette sur les écrans haute densité. Elle s'ouvre le Foyer au
 * milieu, et s'y recentre quand l'écran change de taille (téléphone tourné, fenêtre élargie).
 */
export function CarteDuJeu({ carte }: { carte: CarteDuJoueur }) {
  const toile = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = toile.current;
    const pinceau = canvas?.getContext("2d");
    if (!canvas || !pinceau) return;
    const couleurs = { case: couleurCalculee(canvas, "var(--bloc)"), bord: couleurCalculee(canvas, "var(--trait)") };
    const dessiner = () => {
      const { width: largeur, height: hauteur } = canvas.getBoundingClientRect();
      const densite = window.devicePixelRatio || 1;
      canvas.width = Math.round(largeur * densite);
      canvas.height = Math.round(hauteur * densite);
      pinceau.setTransform(densite, 0, 0, densite, 0, 0);
      dessinerLaCarte(pinceau, carte.cases, vueSurLeFoyer(carte.foyer, largeur, hauteur), couleurs);
    };
    const suivi = new ResizeObserver(dessiner);
    suivi.observe(canvas);
    return () => suivi.disconnect();
  }, [carte]);
  return <canvas ref={toile} className={styles.carte} role="img" aria-label={`Carte du Monde ${carte.monde}, votre Foyer au milieu`} />;
}
