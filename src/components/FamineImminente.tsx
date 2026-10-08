"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  avantFamine,
  avantFamineImminente,
  depuisCombienDeTemps,
  depuisFamine,
  depuisFamineImminente,
  famineImminenteRetenue,
  nourritureRestante,
  tenueDeLaNourriture,
} from "@/monde/nourriture";
import styles from "./BarreHaut.module.css";

/** Le plus long délai qu'un minuteur du navigateur sache attendre : au-delà, il partirait aussitôt. */
const DELAI_MAX_MS = 2_147_483_647;

/**
 * US-0321 : l'avertissement « famine imminente », une bande d'alerte toute la largeur au bas de la barre du
 * haut, sur toutes les pages du jeu : « Famine imminente », le temps que la Nourriture tiendra encore et
 * « Voir » ; toute la bande mène à la page Habitants. Il paraît quand la Nourriture ne couvre plus que
 * FAMINE_IMMINENTE_HEURES heures d'Entretien.
 *
 * `heures` : ce temps-là, compté par le serveur sur les Stocks et l'Entretien lus à l'heure. Page ouverte, il
 * baisse en direct au rythme du jeu (`vitesse`), sur l'horloge du navigateur comme les quantités de la barre
 * (US-0213) ; la bande paraît à l'instant même où il passe le seuil, même en temps accéléré, sans attendre le
 * battement suivant. De nouvelles valeurs arrivent avec une nouvelle clé (ActionsDuJeu) : tout repart d'elles.
 *
 * US-0322 : il dit aussi depuis quand il est actif, « Famine imminente depuis 3 h ». `depuis` : depuis combien
 * d'heures de jeu le Territoire retient la famine imminente, à la lecture ; un seuil franchi pendant l'absence
 * est ainsi là dès l'ouverture, avec son instant exact. Page ouverte, le « depuis » monte en direct. Rien n'est
 * envoyé hors de la page : les notifications du navigateur viendront à l'étape 64.
 *
 * US-0323 : il disparaît dès que le danger est passé : la Nourriture assurée (ActionsDuJeu ne le pose plus) ou
 * couvrant plus de FAMINE_IMMINENTE_HEURES + FAMINE_IMMINENTE_MARGE_HEURES heures ; entre les deux, il garde son
 * état, pour ne pas clignoter autour du seuil. Page ouverte, ce sont les nouvelles valeurs du serveur qui l'ôtent
 * (recalage de la barre, action), le temps restant ne faisant que baisser entre-temps. Le joueur ne peut pas le
 * masquer : la bande n'est qu'un lien vers la page Habitants.
 *
 * US-0325 : en Famine, « famine imminente » laisse la place à « Famine depuis 2 h · Voir », au même endroit, dans la
 * même couleur, plus marquée. `famine` : depuis combien d'heures de jeu le Territoire retient la Famine, à la lecture.
 * Page ouverte, la bande bascule à l'instant même où la Nourriture ne paie plus l'Entretien, même en temps accéléré.
 */
export function FamineImminente({
  heures,
  depuis = null,
  famine = null,
  vitesse = 1,
}: {
  heures: number;
  depuis?: number | null;
  famine?: number | null;
  vitesse?: number;
}) {
  // Le temps réel écoulé depuis l'arrivée des valeurs du serveur.
  const [ecoule, setEcoule] = useState(0);
  // US-0323 : retenue par le Territoire, la famine imminente le reste jusqu'à 13 heures de Nourriture ; au-delà, le
  // danger est passé, et l'avertissement ne reparaît qu'au seuil.
  const retenue = famineImminenteRetenue(heures, depuis);
  const bascule = retenue !== null || famine !== null ? 0 : avantFamineImminente(heures, vitesse);
  // US-0325 : l'instant où la Famine commence, en temps réel après la lecture ; 0 quand le Territoire la retient déjà.
  const debutDeFamine = famine !== null ? 0 : avantFamine(heures, vitesse);

  useEffect(() => {
    const depart = performance.now();
    const battement = setInterval(() => setEcoule(performance.now() - depart), 1000);
    // À l'instant où la Nourriture passe le seuil, jamais avant : le navigateur arrondit le délai d'un minuteur à la
    // milliseconde inférieure, et son horloge peut devancer d'un rien celle de la page. US-0325 : de même à l'instant
    // où la Nourriture ne paie plus l'Entretien.
    const aLInstant = (instant: number) =>
      instant > 0 && instant <= DELAI_MAX_MS ? setTimeout(() => setEcoule(Math.max(instant, performance.now() - depart)), Math.ceil(instant)) : undefined;
    const [apparition, entreeEnFamine] = [aLInstant(bascule), aLInstant(debutDeFamine)];
    return () => {
      clearInterval(battement);
      clearTimeout(apparition);
      clearTimeout(entreeEnFamine);
    };
  }, [bascule, debutDeFamine]);

  if (ecoule < bascule) return null;
  if (ecoule >= debutDeFamine) {
    return (
      <Link href="/jeu/habitants" className={styles.famine} data-alerte-famine="" data-famine="">
        <span>
          <strong className={styles.titreFamine}>Famine</strong> {depuisCombienDeTemps(depuisFamine(heures, famine, ecoule, vitesse))}
        </span>{" "}
        <span className={styles.voirFamine}>Voir</span>
      </Link>
    );
  }
  return (
    <Link href="/jeu/habitants" className={styles.famine} data-alerte-famine="">
      {/* Des espaces entre les morceaux, pour qu'un lecteur d'écran ne les colle pas. */}
      <span>
        <strong className={styles.titreFamine}>Famine imminente</strong> {depuisCombienDeTemps(depuisFamineImminente(heures, retenue, ecoule, vitesse))}
      </span>{" "}
      <span className={styles.tenueFamine}>{tenueDeLaNourriture(nourritureRestante(heures, ecoule, vitesse))}</span>{" "}
      <span className={styles.voirFamine}>Voir</span>
    </Link>
  );
}
