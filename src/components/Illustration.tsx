"use client";

import Image from "next/image";
import { useState } from "react";
import { LOUP_TETE, LOUP_VIEWBOX } from "./loup";
import styles from "./Illustration.module.css";

type IllustrationProps = {
  /** Chemin sous public/illustrations, par exemple « prototype/biomes/forest-1.webp ». */
  chemin: string;
  alt: string;
  /** Rapport largeur / hauteur du cadre, par exemple « 3 / 2 ». */
  ratio?: string;
  /** La largeur affichée selon l'écran, pour charger la bonne taille (voir next/image). */
  sizes?: string;
  /** À charger tout de suite : l'illustration principale, visible sans défiler. */
  prioritaire?: boolean;
  className?: string;
};

/**
 * Une illustration du jeu : servie par Next dans un format léger (AVIF ou WebP) et à la
 * taille de l'écran. Si elle manque ou ne se charge pas, la tête de loup la remplace.
 */
export function Illustration({ chemin, alt, ratio = "1 / 1", sizes = "100vw", prioritaire, className }: IllustrationProps) {
  const [echec, setEchec] = useState(false);
  const classes = [styles.cadre, echec && styles.remplacement, className].filter(Boolean).join(" ");
  return (
    <div className={classes} style={{ aspectRatio: ratio }} role={echec ? "img" : undefined} aria-label={echec ? alt : undefined}>
      {echec ? (
        <IllustrationManquante />
      ) : (
        <Image
          src={`/illustrations/${chemin}`}
          alt={alt}
          fill
          sizes={sizes}
          preload={prioritaire}
          className={styles.image}
          onError={() => setEchec(true)}
        />
      )}
    </div>
  );
}

export function IllustrationManquante() {
  return (
    <svg viewBox={LOUP_VIEWBOX} aria-hidden="true" focusable="false">
      <path d={LOUP_TETE} />
    </svg>
  );
}
