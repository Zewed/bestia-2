"use client";

import { useEffect, useId, useOptimistic, useRef, useState, useTransition } from "react";
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

/** US-0338 : un choix sur un Voyageur dont l'action n'a pas encore répondu : l'accueillir, ou le refuser. */
type Choix = { id: number; accueil: boolean };

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
 * repartir de même. US-0337 : un Voyageur déjà reparti de lui-même n'est pas accueilli ; la partie le dit, en
 * tête, jusqu'au choix suivant.
 *
 * US-0338 : quand les `placesLibres` du Territoire sont toutes prises, comptée d'avance celle de chaque accueil en
 * cours, « Accueillir » est grisé, et une phrase, une seule fois en tête de la partie, dit pourquoi ; un lecteur
 * d'écran l'entend avec chaque bouton grisé. Les Voyageurs attendent toujours, et « Refuser » reste possible.
 */
export function AuxPortes({
  voyageurs,
  maintenant,
  vitesse = 1,
  placesLibres,
}: {
  voyageurs: VoyageurAffiche[];
  maintenant: Date;
  vitesse?: number;
  placesLibres: number;
}) {
  // Les choix dont l'action n'a pas encore répondu : leurs lignes sont retirées d'avance ; un accueil prend déjà sa place.
  const [enCours, choisir] = useOptimistic<Choix[], Choix>([], (actuels, choix) => [...actuels, choix]);
  const affiches = voyageurs.filter((v) => !enCours.some((c) => c.id === v.id));
  const plein = placesLibres - enCours.filter((c) => c.accueil).length <= 0;
  const phrasePlace = useId();
  // US-0339 : les Voyageurs dont un choix attend encore la réponse du serveur.
  const enVol = useRef(new Set<number>());
  const [, demarrer] = useTransition();
  const [annonce, setAnnonce] = useState<string | null>(null);
  const base = maintenant.getTime();
  // Le temps écoulé depuis l'affichage, mesuré pour cette heure du jeu-là : celui d'une heure déjà dépassée ne compte plus.
  const [ecoule, setEcoule] = useState<{ base: number; ms: number } | null>(null);

  useEffect(() => {
    const depart = performance.now();
    const battement = setInterval(() => setEcoule({ base, ms: performance.now() - depart }), 1000);
    return () => clearInterval(battement);
  }, [base]);

  /**
   * Accueille ou refuse le Voyageur : sa ligne disparaît aussitôt, le temps que l'action réponde. US-0339 : un
   * second toucher avant la réponse (un double clic, plus rapide que la ligne) ne relance rien pour ce Voyageur.
   */
  function decider(voyageur: VoyageurAffiche, accueil: boolean) {
    if (enVol.current.has(voyageur.id)) return;
    enVol.current.add(voyageur.id);
    setAnnonce(null);
    demarrer(async () => {
      try {
        choisir({ id: voyageur.id, accueil });
        const rendu = accueil ? await accueillirUnVoyageur(voyageur.id) : await refuserUnVoyageur(voyageur.id);
        if (rendu === "reparti") setAnnonce("Ce Voyageur est déjà reparti.");
      } finally {
        enVol.current.delete(voyageur.id);
      }
    });
  }

  const instant = base + (ecoule?.base === base ? vitesse * ecoule.ms : 0);
  return (
    <Bloc titre="Aux portes" className={styles.auxPortes}>
      {annonce ? (
        <p className={styles.annonce} role="alert">
          {annonce}
        </p>
      ) : null}
      {plein && affiches.length > 0 ? (
        <p id={phrasePlace} className={styles.plusDePlace}>
          Plus de place au Foyer. Des huttes en ajouteront quand les constructions seront là.
        </p>
      ) : null}
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
                  <button
                    type="button"
                    className={styles.accueillir}
                    aria-label={`Accueillir ${v.prenom}`}
                    disabled={plein}
                    aria-describedby={plein ? phrasePlace : undefined}
                    onClick={() => decider(v, true)}
                  >
                    Accueillir
                  </button>
                  <button type="button" className={styles.refuser} aria-label={`Refuser ${v.prenom}`} onClick={() => decider(v, false)}>
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
