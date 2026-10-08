"use client";

import { type RefObject, useCallback, useEffect, useRef, useState } from "react";
import type { Fiche } from "@/monde/fiche";
import type { Coordonnees } from "@/monde/hex";
import { ZONE_COEUR, ZONE_COURONNE } from "@/monde/zones";
import { ficheDeLaCase } from "./actions";
import type { Cadre } from "./dessin";
import styles from "./FicheDeLaCase.module.css";

/** US-0429 : où est la Case dans le Monde, selon sa zone. */
const ZONES: Record<number, string> = { [ZONE_COURONNE]: "Couronne", [ZONE_COEUR]: "Cœur sauvage", 0: "Entre la Couronne et le Cœur sauvage" };

/** La Case choisie sur la carte, et sa fiche : null tant que le serveur ne l'a pas donnée ; `echec` s'il n'a pas pu. */
export type Choix = { case: Coordonnees; fiche: Fiche | null; echec: boolean };

/**
 * US-0428 : la Case que le joueur choisit sur la carte (`choisir`), et sa fiche, demandée au serveur dès qu'elle est
 * choisie : la carte la surligne aussitôt, la fiche se remplit à la réponse. La Case déjà choisie ne se redemande pas,
 * sauf après un échec ; une autre la remplace, et la réponse attendue pour la précédente n'y vient plus. Une Case que
 * le Monde du joueur n'a pas, pour le serveur, n'a pas de fiche.
 */
export function useFicheDeLaCase() {
  const [choix, setChoix] = useState<Choix | null>(null);
  const choisir = useCallback(
    (c: Coordonnees) => setChoix((avant) => (avant && !avant.echec && avant.case.q === c.q && avant.case.r === c.r ? avant : { case: c, fiche: null, echec: false })),
    [],
  );
  // La Case dont la fiche est attendue : elle se demande une fois, et seule sa réponse compte.
  const attendue = choix && !choix.fiche && !choix.echec ? choix.case : null;
  useEffect(() => {
    if (!attendue) return;
    let aJour = true;
    ficheDeLaCase(attendue.q, attendue.r).then(
      (fiche) => aJour && setChoix(fiche ? { case: attendue, fiche, echec: false } : null),
      () => aJour && setChoix({ case: attendue, fiche: null, echec: true }),
    );
    return () => {
      aJour = false;
    };
  }, [attendue]);
  return { choix, choisir };
}

/** Le cadre d'un élément de la page en pixels de la carte, depuis son coin en haut à gauche. */
function surLaCarte(element: Element, carte: Element | null): Cadre {
  const [ici, origine] = [element.getBoundingClientRect(), carte?.getBoundingClientRect() ?? { left: 0, top: 0 }];
  return { x: ici.left - origine.left, y: ici.top - origine.top, largeur: ici.width, hauteur: ici.height };
}

/**
 * US-0428 : la fiche de la Case choisie (`choix`) : son Biome, puis à qui elle est, « Libre », « Votre Foyer » ou le
 * nom du chef. US-0429 : sa zone, sa distance au Foyer (sauf pour le Foyer lui-même) et, au Cœur sauvage, ce qui y
 * vit. Sur ordinateur, un bloc flottant en haut à gauche de la carte (la légende est à droite) : à
 * l'ouverture, à chaque Case et chaque fois que sa taille change, elle demande à la carte de montrer la Case hors
 * d'elle (`montrer`). Vide en attendant le serveur ; les lecteurs d'écran l'entendent une fois remplie. Elle se
 * déclare posée sur la carte : la flèche du Foyer la contourne.
 */
export function FicheDeLaCase({ choix, carte, montrer }: { choix: Choix; carte: RefObject<HTMLCanvasElement | null>; montrer: (c: Coordonnees, cache: Cadre) => void }) {
  const panneau = useRef<HTMLElement>(null);
  const laCase = choix.case;
  // La Case montrée, pour le suivi de taille : la dernière choisie.
  const montree = useRef(laCase);
  useEffect(() => {
    const element = panneau.current!;
    const suivi = new ResizeObserver(() => montrer(montree.current, surLaCarte(element, carte.current)));
    suivi.observe(element);
    return () => suivi.disconnect();
  }, [carte, montrer]);
  useEffect(() => {
    montree.current = laCase;
    montrer(laCase, surLaCarte(panneau.current!, carte.current));
  }, [laCase, carte, montrer]);

  const { fiche, echec } = choix;
  return (
    <section ref={panneau} className={styles.fiche} aria-label="Fiche de la Case" aria-live="polite" aria-busy={!fiche && !echec} data-sur-la-carte="">
      {fiche ? (
        <>
          <h2 className={styles.biome}>{fiche.biome}</h2>
          <dl className={styles.details}>
            <div>
              <dt>Propriétaire</dt>
              <dd>{fiche.aVous ? "Votre Foyer" : (fiche.chef ?? "Libre")}</dd>
            </div>
            <div>
              <dt>Zone</dt>
              <dd>{ZONES[fiche.zone]}</dd>
            </div>
          </dl>
          {fiche.distance > 0 ? <p className={styles.distance}>{`À ${fiche.distance} Case${fiche.distance > 1 ? "s" : ""} de votre Foyer`}</p> : null}
          {fiche.zone === ZONE_COEUR ? <p className={styles.rares}>Les Espèces les plus rares vivent ici.</p> : null}
        </>
      ) : echec ? (
        <p className={styles.echec}>La fiche n&apos;a pas pu s&apos;ouvrir.</p>
      ) : (
        <div className={styles.attente} aria-hidden="true">
          <span />
          <span />
        </div>
      )}
    </section>
  );
}
