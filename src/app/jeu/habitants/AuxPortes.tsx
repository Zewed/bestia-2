"use client";

import { useEffect, useOptimistic, useState, useTransition } from "react";
import { Bloc } from "@/components/Bloc";
import { VOYAGEUR_ALERTE_MINUTES } from "@/reglages";
import { formaterDuree } from "@/temps/affichage";
import { accueillirUnVoyageur, refuserUnVoyageur } from "./actions-aux-portes";
import styles from "./AuxPortes.module.css";

/**
 * Un Voyageur tel que la partie « Aux portes » le montre : son prénom, l'heure du jeu de son arrivée et,
 * US-0333, celle de son départ.
 */
export type VoyageurAffiche = { id: number; prenom: string; arriveLe: Date; departLe: Date };

/** US-0332 : depuis quand un Voyageur attend, en temps du jeu : « arrivé à l'instant », « arrivé il y a 12 min », « arrivé il y a 2 h ». */
function depuisQuand(ms: number): string {
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "arrivé à l'instant";
  if (minutes < 60) return `arrivé il y a ${minutes} min`;
  return `arrivé il y a ${Math.floor(minutes / 60)} h`;
}

/**
 * US-0332 : la partie « Aux portes » de la page Habitants : une ligne par Voyageur qui attend, dans l'ordre
 * de la lecture, du premier arrivé au dernier, avec son prénom et depuis quand il attend, à l'heure du jeu
 * `maintenant` ; « Personne aux portes pour l'instant. » quand personne n'attend. En tête de la colonne sur
 * ordinateur ; au-dessus de la liste quand la colonne passe dessous (AuxPortes.module.css), car un Voyageur
 * n'attend pas toujours.
 *
 * US-0333 : au bout de la ligne, le temps qui lui reste avant son départ, à la minute supérieure (« repart
 * dans 11 h 42 »), qui diminue en direct au rythme du jeu (`vitesse`, donnée par le serveur), sur l'horloge du
 * navigateur comme la barre des ressources ; sous VOYAGEUR_ALERTE_MINUTES minutes, dans la couleur d'alerte, et
 * « sur le départ » une fois le compte à zéro. Aucune zone annoncée : un lecteur d'écran lit le compte quand on
 * y passe, sans qu'il soit répété à chaque minute. Quand la page est relue, tout repart de la nouvelle heure.
 *
 * US-0334 : sous chaque ligne, « Accueillir » : la ligne disparaît aussitôt, le temps que l'action serveur fasse
 * du Voyageur un Habitant et relise la page, qui fait alors foi. US-0336 : à côté, « Refuser », qui le fait
 * repartir de même.
 */
export function AuxPortes({ voyageurs, maintenant, vitesse = 1 }: { voyageurs: VoyageurAffiche[]; maintenant: Date; vitesse?: number }) {
  const [affiches, retirer] = useOptimistic(voyageurs, (actuels, parti: number) => actuels.filter((v) => v.id !== parti));
  const [, demarrer] = useTransition();
  const base = maintenant.getTime();
  // Le temps écoulé depuis l'affichage, mesuré pour cette heure du jeu-là : celui d'une heure déjà dépassée ne compte plus.
  const [ecoule, setEcoule] = useState<{ base: number; ms: number } | null>(null);

  useEffect(() => {
    const depart = performance.now();
    const battement = setInterval(() => setEcoule({ base, ms: performance.now() - depart }), 1000);
    return () => clearInterval(battement);
  }, [base]);

  /** Accueille ou refuse le Voyageur : sa ligne disparaît aussitôt, le temps que l'action réponde. */
  function decider(voyageur: VoyageurAffiche, action: (voyageurId: number) => Promise<void>) {
    demarrer(async () => {
      retirer(voyageur.id);
      await action(voyageur.id);
    });
  }

  const instant = base + (ecoule?.base === base ? vitesse * ecoule.ms : 0);
  return (
    <Bloc titre="Aux portes" className={styles.auxPortes}>
      {affiches.length > 0 ? (
        <ul className={styles.voyageurs}>
          {affiches.map((v) => {
            const reste = v.departLe.getTime() - instant;
            // L'alerte vient avec le premier compte affiché sous le seuil (« 59 min »), à la minute supérieure comme lui.
            const alerte = Math.ceil(reste / 60_000) < VOYAGEUR_ALERTE_MINUTES;
            return (
              <li key={v.id} className={styles.voyageur}>
                <span className={styles.prenom}>{v.prenom}</span>
                <span className={styles.arrivee}>{depuisQuand(instant - v.arriveLe.getTime())}</span>
                <span className={styles.depart} data-alerte={alerte ? "" : undefined}>
                  {reste > 0 ? `repart dans ${formaterDuree(reste / 3_600_000)}` : "sur le départ"}
                </span>
                <div className={styles.choix}>
                  {/* Deux boutons par ligne : un lecteur d'écran entend aussi qui il accueille, ou refuse. */}
                  <button type="button" className={styles.accueillir} aria-label={`Accueillir ${v.prenom}`} onClick={() => decider(v, accueillirUnVoyageur)}>
                    Accueillir
                  </button>
                  <button type="button" className={styles.refuser} aria-label={`Refuser ${v.prenom}`} onClick={() => decider(v, refuserUnVoyageur)}>
                    Refuser
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className={styles.personne}>Personne aux portes pour l&apos;instant.</p>
      )}
    </Bloc>
  );
}
