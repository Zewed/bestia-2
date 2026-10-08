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
 * milieu, et s'y recentre quand l'écran change de taille (téléphone tourné, fenêtre élargie). US-0418 : chaque
 * teinte de la carte peinte de la couleur CSS que la page lui donne (`fonds`, dans l'ordre de ses teintes), ses
 * motifs d'Encre ou d'Ivoire légers, et un bord d'Encre à peine marqué entre les Cases.
 */
export function CarteDuJeu({ carte, fonds }: { carte: CarteDuJoueur; fonds: string[] }) {
  const toile = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = toile.current;
    const pinceau = canvas?.getContext("2d");
    if (!canvas || !pinceau) return;
    const peinture = {
      fonds: fonds.map((fond) => couleurCalculee(canvas, fond)),
      bord: couleurCalculee(canvas, "color-mix(in oklch, var(--encre) 14%, transparent)"),
      motifSombre: couleurCalculee(canvas, "color-mix(in oklch, var(--encre) 26%, transparent)"),
      motifClair: couleurCalculee(canvas, "color-mix(in oklch, var(--ivoire) 45%, transparent)"),
    };
    const dessiner = () => {
      const { width: largeur, height: hauteur } = canvas.getBoundingClientRect();
      const densite = window.devicePixelRatio || 1;
      canvas.width = Math.round(largeur * densite);
      canvas.height = Math.round(hauteur * densite);
      pinceau.setTransform(densite, 0, 0, densite, 0, 0);
      dessinerLaCarte(pinceau, carte, vueSurLeFoyer(carte.foyer, largeur, hauteur), peinture);
    };
    const suivi = new ResizeObserver(dessiner);
    suivi.observe(canvas);
    return () => suivi.disconnect();
  }, [carte, fonds]);
  return <canvas ref={toile} className={styles.carte} role="img" aria-label={`Carte du Monde ${carte.monde}, votre Foyer au milieu`} />;
}
