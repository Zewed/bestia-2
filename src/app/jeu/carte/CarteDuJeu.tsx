"use client";

import { getImageProps } from "next/image";
import { useEffect, useRef } from "react";
import type { CarteDuJoueur } from "@/monde/carte";
import { dessinerLaCarte, vueSurLeFoyer, type Hutte, type Vue } from "./dessin";
import { suivreLesGestes } from "./gestes";
import styles from "./page.module.css";
import { avancer, cadrer, deplacer, limiteDeLaCarte, zoomer } from "./vue";

/**
 * US-0419 : l'illustration de la hutte du chef, celle de l'écran du Foyer (tous les Foyers naissent en prairie),
 * servie par Next en petit : assez pour une Case nette sur un écran haute densité.
 */
const HUTTE = getImageProps({ src: "/illustrations/foyer/prairie.webp", alt: "", width: 192, height: 128 }).props.src;

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
 * milieu. US-0418 : chaque teinte de la carte peinte de la couleur CSS que la page lui donne (`fonds`, dans l'ordre
 * de ses teintes), ses motifs d'Encre ou d'Ivoire légers, et un bord d'Encre à peine marqué entre les Cases.
 * US-0419 : son Foyer marqué d'un repère citron dès l'ouverture, la hutte du chef posée dessus une fois
 * l'illustration chargée ; les Foyers des autres chefs en Encre. US-0420 : on la fait glisser (gestes.ts), dans les
 * limites de la vue (vue.ts) ; chaque geste change la vue aussitôt, mais la carte n'est redessinée qu'au rythme de
 * l'écran. Quand l'écran change de taille (téléphone tourné, fenêtre élargie), elle garde le même endroit au milieu.
 * US-0421 : de même au doigt. US-0422 : sélectionnée au clavier, elle avance aux flèches. US-0423 : elle zoome à
 * la molette ou au pavé tactile, autour du pointeur, entre la vue large et la vue rapprochée. US-0424 : de même en
 * pinçant à deux doigts, autour du point entre eux.
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
      encre: couleurCalculee(canvas, "var(--encre)"),
      repere: couleurCalculee(canvas, "var(--citron)"),
    };
    let hutte: Hutte | null = null;
    // Ce que montre la carte, d'un geste à l'autre, une fois connue la place qu'elle a ; la limite de son milieu.
    let vue: Vue | null = null;
    const limite = limiteDeLaCarte(carte);
    const dessiner = () => {
      if (vue) dessinerLaCarte(pinceau, carte, vue, peinture, hutte);
    };
    // La toile à la taille que la page lui donne, à l'ouverture et à chaque changement : la redimensionner l'efface.
    // US-0423 : le zoom ramené dans les bornes de cette taille.
    const redimensionner = () => {
      const { width: largeur, height: hauteur } = canvas.getBoundingClientRect();
      const densite = window.devicePixelRatio || 1;
      canvas.width = Math.round(largeur * densite);
      canvas.height = Math.round(hauteur * densite);
      pinceau.setTransform(densite, 0, 0, densite, 0, 0);
      vue = cadrer(vue ?? vueSurLeFoyer(carte.foyer, largeur, hauteur), largeur, hauteur);
      dessiner();
    };
    // US-0420 : le dessin demandé pour la prochaine image de l'écran, s'il y en a un : un seul par image.
    let image = 0;
    const changer = (nouvelle: Vue) => {
      vue = nouvelle;
      image ||= requestAnimationFrame(() => {
        image = 0;
        dessiner();
      });
    };
    const illustration = new Image();
    illustration.onload = () => {
      hutte = { image: illustration, largeur: illustration.naturalWidth, hauteur: illustration.naturalHeight };
      dessiner();
    };
    illustration.src = HUTTE;
    const suivi = new ResizeObserver(redimensionner);
    suivi.observe(canvas);
    const arreter = suivreLesGestes(canvas, {
      deplacer: (dx, dy) => vue && changer(deplacer(vue, dx, dy, limite)),
      avancer: (colonnes, rangees) => vue && changer(avancer(vue, colonnes, rangees, limite)),
      zoomer: (facteur, x, y) => vue && changer(zoomer(vue, facteur, x, y, limite)),
    });
    return () => {
      suivi.disconnect();
      illustration.onload = null;
      arreter();
      cancelAnimationFrame(image);
    };
  }, [carte, fonds]);
  // US-0422 : une carte qu'on manie, au clavier aussi : elle se sélectionne, et les flèches lui reviennent.
  return <canvas ref={toile} className={styles.carte} tabIndex={0} role="application" aria-roledescription="carte" aria-label="Carte du Monde" />;
}
