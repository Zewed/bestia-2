"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { Bloc } from "@/components/Bloc";
import { dureeDuTrajetMinutes, sansEscorte } from "@/expeditions/allure";
import { forceDeLEscorte } from "@/expeditions/force";
import { horaireDuSejour } from "@/expeditions/sejour";
import type { EspeceDisponible } from "@/monde/effectif";
import { formaterMinutes } from "@/temps/affichage";
import { entier, escorteChoisie } from "./Escorte";
import { explorateursChoisis } from "./Explorateurs";
import { Partir } from "./Partir";
import styles from "./Recapitulatif.module.css";
import { sejourDeLAdresse } from "./Sejour";

/** Le fuseau des joueurs, pour l'heure de retour prévue. */
const FUSEAU = "Europe/Paris";

const MINUTE_MS = 60_000;

/** Ce que le récapitulatif dit d'une durée ou d'une heure qu'il ne peut pas encore chiffrer. */
const AUCUNE = "—";

/** US-0910 : l'heure de retour prévue, dans le fuseau du joueur : « 9 octobre à 14:05 », comme le prochain retour (US-0903). */
const quand = (instant: Date) =>
  new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: FUSEAU }).format(instant);

/** « 7 Cases de votre Foyer », « 1 Case de votre Foyer », comme le bloc Destination. */
const casesDuFoyer = (n: number) => `${n} Case${n > 1 ? "s" : ""} de votre Foyer`;

/** « Souris grise × 3 » : une Espèce de l'escorte et ses Bêtes qui partent, que le nombre ne quitte jamais (espaces insécables). */
const uneEspece = (nom: string, nombre: number) => `${nom} × ${nombre}`;

/** US-0910 : la destination choisie, telle que le récapitulatif la montre : son Biome (null sous le brouillard) et sa distance au Foyer. */
export type DestinationChoisie = { biome: string | null; distance: number };

/**
 * US-0910 : le récapitulatif de l'écran d'Expédition, à son pied, à relire avant de partir. Il relit l'adresse, comme
 * les autres blocs, et suit chaque choix au fil de la composition : les explorateurs, l'escorte Espèce par Espèce et sa
 * force, ou « Sans escorte » à la place (US-0909) ; la destination et son Biome, ou « inconnu » ; les durées de l'aller,
 * du séjour et du retour ; l'heure de retour prévue d'un départ à l'heure du jeu : celle de l'ouverture de l'écran
 * (`maintenant`), qui avance en direct au rythme du jeu (`vitesse`, donnée par le serveur) sur l'horloge du navigateur,
 * comme le compte à rebours des Voyageurs (US-0333). Le trajet d'une escorte, à l'allure de sa Bête la plus lente, arrive avec US-0912 : d'ici là, ni son
 * aller, ni son retour, ni son heure ne sont chiffrés. Il rappelle que ceux qui partent mangent toujours (US-0921), et
 * finit sur « Partir ». Sur un téléphone, il reste en bas de l'écran pendant qu'on compose, replié sur l'heure de retour
 * et le départ ; un bouton le déplie.
 */
export function Recapitulatif({
  libres,
  especes,
  destination,
  maintenant,
  vitesse = 1,
}: {
  libres: number;
  especes: EspeceDisponible[];
  destination: DestinationChoisie | null;
  maintenant: Date;
  vitesse?: number;
}) {
  const recherche = useSearchParams();
  const idLignes = useId();
  const [deplie, setDeplie] = useState(false);
  const base = maintenant.getTime();
  // Le temps écoulé depuis l'affichage, mesuré pour cette heure du jeu-là : celui d'une heure déjà dépassée ne compte plus.
  const [ecoule, setEcoule] = useState<{ base: number; ms: number } | null>(null);
  useEffect(() => {
    const depart = performance.now();
    const battement = setInterval(() => setEcoule({ base, ms: performance.now() - depart }), 1000);
    return () => clearInterval(battement);
  }, [base]);

  const explorateurs = explorateursChoisis(recherche, libres);
  const choix = escorteChoisie(recherche, especes);
  const escorte = especes.filter((e) => choix.get(e.id)! > 0);
  const sejour = sejourDeLAdresse(recherche);
  const aller = destination ? dureeDuTrajetMinutes(destination.distance, choix) : null;
  // Un départ à l'heure du jeu, qui avance au rythme du jeu ; le retour dure autant que l'aller (US-0912), après le
  // séjour, qui ne commence qu'à l'arrivée (US-0906).
  const depart = new Date(base + (ecoule?.base === base ? vitesse * ecoule.ms : 0));
  const retour = aller === null ? null : new Date(horaireDuSejour(depart, aller * MINUTE_MS, sejour).fin.getTime() + aller * MINUTE_MS);

  return (
    <Bloc titre="Récapitulatif" className={deplie ? `${styles.recap} ${styles.deplie}` : styles.recap}>
      <button
        type="button"
        className={styles.deplier}
        aria-label="Tout le récapitulatif"
        aria-expanded={deplie}
        aria-controls={idLignes}
        onClick={() => setDeplie(!deplie)}
      >
        <svg viewBox="0 0 12 12" className={styles.fleche} aria-hidden="true">
          <path d="M2.5 4.5 6 8l3.5-3.5" />
        </svg>
      </button>
      <dl id={idLignes} className={styles.lignes}>
        <div>
          <dt>Explorateurs</dt>
          <dd>{explorateurs > 0 ? explorateurs : "Aucun"}</dd>
        </div>
        <div>
          <dt>Escorte</dt>
          <dd>{sansEscorte(choix) ? "Sans escorte : Bêtes communes seulement" : escorte.map((e) => uneEspece(e.nom, choix.get(e.id)!)).join(", ")}</dd>
        </div>
        {sansEscorte(choix) ? null : (
          <div>
            <dt>Force</dt>
            <dd>{entier(forceDeLEscorte(escorte.map((e) => ({ force: e.force, nombre: choix.get(e.id)! }))))}</dd>
          </div>
        )}
        <div>
          <dt>Destination</dt>
          <dd>{destination ? casesDuFoyer(destination.distance) : "Aucune"}</dd>
        </div>
        {destination ? (
          <div>
            <dt>Biome</dt>
            <dd>{destination.biome ?? "inconnu"}</dd>
          </div>
        ) : null}
        <div>
          <dt>Aller</dt>
          <dd>{aller === null ? AUCUNE : formaterMinutes(aller)}</dd>
        </div>
        <div>
          <dt>Séjour</dt>
          <dd>{formaterMinutes(sejour)}</dd>
        </div>
        <div>
          <dt>Retour</dt>
          <dd>{aller === null ? AUCUNE : formaterMinutes(aller)}</dd>
        </div>
        <div className={styles.essentiel}>
          <dt>Retour prévu</dt>
          <dd>{retour ? <time dateTime={retour.toISOString()}>{quand(retour)}</time> : AUCUNE}</dd>
        </div>
      </dl>
      <p className={styles.manger}>Ceux qui partent continuent de manger pendant toute l&apos;absence.</p>
      <Partir libres={libres} destination={destination !== null} />
    </Bloc>
  );
}
