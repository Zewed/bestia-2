"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Bloc } from "@/components/Bloc";
import { SEJOUR_PAR_DEFAUT_MINUTES, sejourChoisi } from "@/expeditions/sejour";
import { SEJOUR_MINUTES, SEJOURS_TOUT_PRETS_MINUTES } from "@/reglages";
import { formaterMinutes } from "@/temps/affichage";
import styles from "./Sejour.module.css";

/** US-0906 : le paramètre de l'adresse qui garde la durée choisie, en minutes (« ?sejour=240 »). */
const PARAMETRE_DU_SEJOUR = "sejour";
/**
 * Au curseur, l'adresse ne garde la durée qu'après ce temps sans nouveau pas : un glissement d'un bout à l'autre ne la
 * réécrit qu'une fois, sous la limite que Safari met aux réécritures (une centaine en 10 secondes).
 */
const FIN_DU_GESTE_MS = 250;

/** La durée que dit l'adresse, ou la première toute prête si elle n'en dit aucune qu'on aurait pu choisir. */
const dureeDeLAdresse = (valeur: string | null) => sejourChoisi(valeur) ?? SEJOUR_PAR_DEFAUT_MINUTES;

/**
 * US-0906 : le bloc Séjour de l'écran d'Expédition : la durée choisie, en grand ; un curseur de la plus courte à la plus
 * longue, par pas réguliers ; puis, d'un doigt, les durées toutes prêtes, la choisie pressée. Il suit la durée de
 * l'adresse, sinon la première toute prête, et l'adresse la garde à chaque choix (replaceState, que Next.js relie à
 * useSearchParams), pour un rechargement ou un retour arrière, sans toucher à ses autres paramètres : aussitôt pour une
 * durée toute prête, une fois le geste fini au curseur. Le curseur porte la durée au formulaire de départ (US-0911), où
 * le séjour ne commencera qu'à l'arrivée.
 */
export function Sejour() {
  const dansLAdresse = useSearchParams()?.get(PARAMETRE_DU_SEJOUR) ?? null;
  const [minutes, setMinutes] = useState(() => dureeDeLAdresse(dansLAdresse));
  // Un lien vers l'écran rouvre la même page sans la remonter : la durée suit alors l'adresse, comme la destination.
  const [lue, setLue] = useState(dansLAdresse);
  if (dansLAdresse !== lue) {
    setLue(dansLAdresse);
    setMinutes(dureeDeLAdresse(dansLAdresse));
  }
  const curseur = useId();
  const ecritureAVenir = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Une durée glissée qui attend la fin du geste n'est pas écrite dans une adresse qu'un lien a remplacée, ni après.
  useEffect(() => () => clearTimeout(ecritureAVenir.current), [dansLAdresse]);

  function garderDansLAdresse(choisies: number) {
    clearTimeout(ecritureAVenir.current);
    const parametres = new URLSearchParams(window.location.search);
    parametres.set(PARAMETRE_DU_SEJOUR, String(choisies));
    window.history.replaceState(null, "", `?${parametres}`);
  }

  function choisir(choisies: number) {
    setMinutes(choisies);
    garderDansLAdresse(choisies);
  }

  function glisser(choisies: number) {
    setMinutes(choisies);
    clearTimeout(ecritureAVenir.current);
    ecritureAVenir.current = setTimeout(() => garderDansLAdresse(choisies), FIN_DU_GESTE_MS);
  }

  return (
    <Bloc titre="Séjour" className={styles.sejour}>
      <div className={styles.reglage}>
        {/* Le curseur annonce déjà la durée : l'affichage ne la répète pas. */}
        <output htmlFor={curseur} className={styles.duree} aria-live="off">
          {formaterMinutes(minutes)}
        </output>
        <input
          id={curseur}
          className={styles.curseur}
          type="range"
          name={PARAMETRE_DU_SEJOUR}
          min={SEJOUR_MINUTES.min}
          max={SEJOUR_MINUTES.max}
          step={SEJOUR_MINUTES.pas}
          value={minutes}
          aria-label="Durée du séjour"
          aria-valuetext={formaterMinutes(minutes)}
          onChange={(e) => glisser(Number(e.target.value))}
        />
        <div className={styles.bornes} aria-hidden="true">
          <span>{formaterMinutes(SEJOUR_MINUTES.min)}</span>
          <span>{formaterMinutes(SEJOUR_MINUTES.max)}</span>
        </div>
        <div className={styles.prets} role="group" aria-label="Durées toutes prêtes">
          {SEJOURS_TOUT_PRETS_MINUTES.map((m) => (
            <button key={m} type="button" className={styles.pret} aria-pressed={m === minutes} onClick={() => choisir(m)}>
              {formaterMinutes(m)}
            </button>
          ))}
        </div>
      </div>
    </Bloc>
  );
}
