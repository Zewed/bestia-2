"use client";

import { type RefObject, useEffect, useRef } from "react";
import { DetailDeLExpedition } from "@/components/DetailDeLExpedition";
import type { ExpeditionEnCours } from "@/expeditions/en-cours";
import { positionDUneExpedition } from "@/expeditions/position";
import type { Coordonnees } from "@/monde/hex";
import { useHeureDuJeu } from "@/temps/heure-du-jeu";
import { aLEcran, type Cadre, type Vue } from "./dessin";
import styles from "./ExpeditionsSurLaCarte.module.css";
import { PanneauSurLaCarte } from "./FicheDeLaCase";

/** US-0913 : la moitié de la place d'un repère, 44 px pour le doigt, comme la flèche du Foyer : un toucher à moins de tant de pixels de son centre le touche. */
const DEMI_PLACE = 22;

/** US-0913 : une Expédition en cours sur la carte, et son chemin (cheminDUneExpedition), calculé une fois. */
export type ExpeditionSurLaCarte = { expedition: ExpeditionEnCours; chemin: readonly Coordonnees[] };

/**
 * US-0913 : le repère d'une Expédition, tel que la carte le pose à chaque dessin : son bouton, son chemin et où elle en est
 * (`avancee`, positionDUneExpedition) ; puis là où la carte l'a posé, en pixels de la carte (`ici`), null s'il est caché.
 */
export type Repere = { id: number; bouton: HTMLButtonElement | null; chemin: readonly Coordonnees[]; avancee: number; ici: { x: number; y: number } | null };

/**
 * US-0913 : le point de l'écran où en est une Expédition sur son chemin, montré par `vue` : sur la droite qui va du centre
 * de la dernière Case atteinte au centre de la suivante, à la part du pas déjà faite (`avancee`, en Cases depuis le Foyer).
 */
export function pointDuChemin(foyer: Coordonnees, chemin: readonly Coordonnees[], avancee: number, vue: Vue): { x: number; y: number } {
  const rang = Math.min(Math.floor(avancee), chemin.length);
  const depuis = aLEcran(rang === 0 ? foyer : chemin[rang - 1], vue);
  const part = avancee - rang;
  if (part === 0 || rang === chemin.length) return depuis;
  const vers = aLEcran(chemin[rang], vue);
  return { x: depuis.x + (vers.x - depuis.x) * part, y: depuis.y + (vers.y - depuis.y) * part };
}

/**
 * US-0913 : pose chaque repère sur la carte montrée par `vue` : au point de son chemin où en est son Expédition, caché
 * quand ce point sort de l'écran. La carte l'appelle à chaque dessin, et le temps du jeu à chaque seconde : les repères
 * suivent la vue à chaque image, sans que la carte se redessine quand ils avancent.
 */
export function placerLesReperes(reperes: readonly Repere[], foyer: Coordonnees, vue: Vue): void {
  for (const repere of reperes) {
    const { x, y } = pointDuChemin(foyer, repere.chemin, repere.avancee, vue);
    const visible = x >= 0 && x <= vue.largeur && y >= 0 && y <= vue.hauteur;
    repere.ici = visible ? { x, y } : null;
    if (!repere.bouton) continue;
    repere.bouton.hidden = !visible;
    if (visible) repere.bouton.style.transform = `translate(${x}px, ${y}px)`;
  }
}

/** US-0913 : l'Expédition dont le repère est sous le point (x, y) de la carte, à moins de DEMI_PLACE pixels : la plus proche ; null sinon. */
export function repereSous(reperes: readonly Repere[], x: number, y: number): number | null {
  let plusProche: { id: number; ecart: number } | null = null;
  for (const { id, ici } of reperes) {
    const ecart = ici ? Math.hypot(ici.x - x, ici.y - y) : Infinity;
    if (ecart <= DEMI_PLACE && (!plusProche || ecart < plusProche.ecart)) plusProche = { id, ecart };
  }
  return plusProche?.id ?? null;
}

/** US-0913 : ce que le repère d'une Expédition dit aux lecteurs d'écran : vers quoi elle va. */
const versOu = ({ destination }: ExpeditionEnCours) => `Expédition vers ${"inconnue" in destination ? "une Case inconnue" : destination.biome}`;

/**
 * US-0913 : les Expéditions en cours du joueur sur la carte, seulement les siennes (la page ne lui donne qu'elles) :
 * l'heure du jeu, partie de `maintenant` à l'affichage de la page, qui avance au rythme du jeu (`vitesse`,
 * useHeureDuJeu) ; le repère de chacune, un bouton par-dessus la carte, que la carte pose sur son chemin, à chaque
 * seconde (`poser`) comme à chaque dessin ; et la fiche de l'Expédition suivie (`suivie`) : son détail, celui de la liste des Expéditions, avec sa
 * phase, son temps restant, ses explorateurs et son escorte. Toucher un repère, ou l'appuyer au clavier, la suit
 * (`suivre`). Sa fiche se ferme (`fermer`) comme celle d'une Case ; la carte glisse pour qu'elle ne cache pas la Case la
 * plus proche de son repère (`montrer`).
 */
export function ExpeditionsSurLaCarte({
  expeditions,
  foyer,
  maintenant,
  vitesse,
  poser,
  suivie,
  suivre,
  fermer,
  carte,
  montrer,
}: {
  expeditions: readonly ExpeditionSurLaCarte[];
  foyer: Coordonnees;
  maintenant: Date;
  vitesse: number;
  poser: (reperes: Repere[]) => void;
  suivie: number | null;
  suivre: (id: number) => void;
  fermer: () => void;
  carte: RefObject<HTMLCanvasElement | null>;
  montrer: (c: Coordonnees, cache: Cadre) => void;
}) {
  const instant = useHeureDuJeu(maintenant, vitesse);
  const positions = expeditions.map(({ expedition, chemin }) => positionDUneExpedition(foyer, expedition.destination, expedition, instant, chemin));
  const boutons = useRef<(HTMLButtonElement | null)[]>([]);
  // À chaque seconde du jeu : où en est chaque Expédition, pour la carte, qui pose aussitôt leurs repères.
  useEffect(() => poser(expeditions.map(({ expedition, chemin }, i) => ({ id: expedition.id, bouton: boutons.current[i], chemin, avancee: positions[i].avancee, ici: null }))));
  // Plus aucun repère sur la carte une fois les Expéditions parties de la page.
  useEffect(() => () => poser([]), [poser]);
  const rang = expeditions.findIndex(({ expedition }) => expedition.id === suivie);
  // La Case la plus proche du repère de l'Expédition suivie : celle que sa fiche ne doit pas cacher.
  const proche = rang < 0 ? 0 : Math.round(positions[rang].avancee);
  return (
    <>
      {expeditions.map(({ expedition }, i) => (
        <button
          key={expedition.id}
          ref={(bouton) => {
            boutons.current[i] = bouton;
          }}
          type="button"
          className={styles.repere}
          hidden
          aria-label={versOu(expedition)}
          aria-expanded={expedition.id === suivie}
          onClick={() => suivre(expedition.id)}
        >
          <svg viewBox="0 0 32 32" focusable="false" aria-hidden="true">
            <circle className={styles.halo} cx="16" cy="16" r="14" />
            <circle className={styles.pastille} cx="16" cy="16" r="9.5" />
            <circle className={styles.oeil} cx="16" cy="16" r="3.5" />
          </svg>
        </button>
      ))}
      {rang < 0 ? null : (
        <PanneauSurLaCarte
          nom="Fiche de l'Expédition"
          laCase={proche === 0 ? foyer : expeditions[rang].chemin[proche - 1]}
          carte={carte}
          montrer={montrer}
          fermer={fermer}
        >
          <h2 className={styles.titre}>Expédition</h2>
          <DetailDeLExpedition expedition={expeditions[rang].expedition} instant={instant} />
        </PanneauSurLaCarte>
      )}
    </>
  );
}
