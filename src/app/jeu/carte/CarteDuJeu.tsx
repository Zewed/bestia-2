"use client";

import { getImageProps } from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CarteDuJoueur } from "@/monde/carte";
import type { Coordonnees } from "@/monde/hex";
import { BoutonsDeLaCarte } from "./BoutonsDeLaCarte";
import { type Cadre, dessinerLaCarte, vueSurLeFoyer, type Hutte, type Vue } from "./dessin";
import { FicheDeLaCase, useFicheDeLaCase } from "./FicheDeLaCase";
import { FlecheDuFoyer, placerLaFleche } from "./FlecheDuFoyer";
import { suivreLesGestes } from "./gestes";
import { glisser } from "./mouvement";
import styles from "./page.module.css";
import { avancer, cadrer, caseSous, deplacer, devoiler, limiteDeLaCarte, retourAuFoyer, zoomer, zoomPossible } from "./vue";
import { retenirLaVue, vueRetenue } from "./vue-retenue";

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
 * pinçant à deux doigts, autour du point entre eux. US-0425 : et aux boutons « + » et « − », autour du milieu de
 * l'écran, chacun grisé quand sa limite est atteinte, quel que soit le geste qui l'a atteinte. US-0426 : le bouton du
 * Foyer, ou la flèche qui le montre quand il est hors de l'écran, y ramène la carte en glissant ; un geste l'arrête.
 * US-0427 : pendant la visite, elle se rouvre là où on l'a laissée, au même zoom (vue-retenue.ts). US-0428 : toucher
 * une Case (ou Entrée) ouvre sa fiche (FicheDeLaCase), la Case surlignée ; la carte glisse pour que la fiche ne la
 * cache pas, et la flèche du Foyer la contourne.
 */
export function CarteDuJeu({ carte, fonds }: { carte: CarteDuJoueur; fonds: string[] }) {
  const toile = useRef<HTMLCanvasElement>(null);
  // US-0425 : si l'on peut encore rapprocher ou éloigner la carte, et le zoom d'un cran autour du milieu de l'écran.
  const [zoom, setZoom] = useState({ rapprocher: true, eloigner: true });
  const zoomerAuMilieu = useRef<(facteur: number) => void>(() => {});
  // US-0426 : le retour au Foyer, et la flèche qui le montre.
  const revenirAuFoyer = useRef(() => {});
  const fleche = useRef<HTMLButtonElement>(null);
  // US-0428 : la Case choisie et sa fiche ; ce que la fiche demande à la carte : se redessiner, la Case surlignée, et
  // glisser pour que la fiche (`cache`, en pixels de la carte) ne la cache pas.
  const { choix, choisir } = useFicheDeLaCase();
  const choisie = useRef<Coordonnees | null>(null);
  const pourLaFiche = useRef<{ redessiner: () => void; montrer: (c: Coordonnees, cache: Cadre) => void }>({ redessiner: () => {}, montrer: () => {} });
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
    // US-0426 : la flèche du Foyer suit chaque dessin. US-0427 : la vue retenue à chaque dessin, au plus un par image.
    const dessiner = () => {
      if (!vue) return;
      dessinerLaCarte(pinceau, carte, vue, peinture, hutte, choisie.current);
      placerLaFleche(fleche.current, canvas, vue, carte.foyer);
      retenirLaVue(carte, vue);
    };
    // US-0425 : les boutons de zoom grisés ou non selon la vue, sans rien redessiner s'ils ne changent pas.
    const griser = () => {
      if (!vue) return;
      const possible = zoomPossible(vue);
      setZoom((avant) => (avant.rapprocher === possible.rapprocher && avant.eloigner === possible.eloigner ? avant : possible));
    };
    // La toile à la taille que la page lui donne, à l'ouverture et à chaque changement : la redimensionner l'efface.
    // US-0423 : le zoom ramené dans les bornes de cette taille. US-0427 : à l'ouverture, la vue retenue s'il y en a une.
    const redimensionner = () => {
      const { width: largeur, height: hauteur } = canvas.getBoundingClientRect();
      const densite = window.devicePixelRatio || 1;
      canvas.width = Math.round(largeur * densite);
      canvas.height = Math.round(hauteur * densite);
      pinceau.setTransform(densite, 0, 0, densite, 0, 0);
      vue = cadrer(vue ?? vueRetenue(carte, largeur, hauteur) ?? vueSurLeFoyer(carte.foyer, largeur, hauteur), largeur, hauteur);
      dessiner();
      griser();
    };
    // US-0420 : le dessin demandé pour la prochaine image de l'écran, s'il y en a un : un seul par image. US-0426 :
    // un geste arrête le retour au Foyer en cours.
    let image = 0;
    let mouvement = () => {};
    const changer = (nouvelle: Vue) => {
      mouvement();
      vue = nouvelle;
      image ||= requestAnimationFrame(() => {
        image = 0;
        dessiner();
      });
      griser();
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
      toucher: (x, y) => {
        const c = vue && caseSous(carte, vue, x, y);
        if (c) choisir(c);
      },
    });
    zoomerAuMilieu.current = (facteur) => vue && changer(zoomer(vue, facteur, vue.largeur / 2, vue.hauteur / 2, limite));
    // US-0426 : le retour au Foyer, chaque vue dessinée aussitôt, à l'image de l'écran du mouvement, à la taille de la carte.
    revenirAuFoyer.current = () => {
      mouvement();
      if (!vue) return;
      mouvement = glisser(vue, retourAuFoyer(vue, carte.foyer), (etape) => {
        cancelAnimationFrame(image);
        image = 0;
        vue = cadrer(etape, vue!.largeur, vue!.hauteur);
        dessiner();
        griser();
      });
    };
    // US-0428 : la carte redessinée (la flèche du Foyer reposée) quand la fiche change, glissée si elle cache la Case.
    pourLaFiche.current = {
      redessiner: dessiner,
      montrer: (c, cache) => {
        const montree = vue && devoiler(vue, c, cache, limite);
        if (montree && montree !== vue) changer(montree);
        else dessiner();
      },
    };
    return () => {
      suivi.disconnect();
      illustration.onload = null;
      arreter();
      cancelAnimationFrame(image);
      mouvement();
      zoomerAuMilieu.current = () => {};
      revenirAuFoyer.current = () => {};
      pourLaFiche.current = { redessiner: () => {}, montrer: () => {} };
    };
  }, [carte, fonds, choisir]);
  // US-0428 : la Case choisie surlignée aussitôt, et plus du tout une fois la fiche fermée.
  const laCase = choix?.case ?? null;
  useEffect(() => {
    choisie.current = laCase;
    pourLaFiche.current.redessiner();
  }, [laCase]);
  const montrer = useCallback((c: Coordonnees, cache: Cadre) => pourLaFiche.current.montrer(c, cache), []);
  return (
    <div className={styles.cadre}>
      {/* US-0422 : une carte qu'on manie, au clavier aussi : elle se sélectionne, et les flèches lui reviennent. */}
      <canvas ref={toile} className={styles.carte} tabIndex={0} role="application" aria-roledescription="carte" aria-label="Carte du Monde" />
      <FlecheDuFoyer ref={fleche} revenir={() => revenirAuFoyer.current()} />
      <BoutonsDeLaCarte {...zoom} zoomer={(facteur) => zoomerAuMilieu.current(facteur)} revenir={() => revenirAuFoyer.current()} />
      {choix ? <FicheDeLaCase choix={choix} carte={toile} montrer={montrer} /> : null}
    </div>
  );
}
