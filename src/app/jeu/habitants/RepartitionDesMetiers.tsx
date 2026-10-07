"use client";

import Image from "next/image";
import { useTransition } from "react";
import { Bloc } from "@/components/Bloc";
import { ajouterAuMetier, retirerDuMetier } from "./actions";
import { useHabitantsMontres } from "./HabitantsMontres";
import type { HabitantAffiche } from "./ListeDesHabitants";
import styles from "./page.module.css";

/** US-0307 : un Métier tel que le bloc Métiers le montre, son icône déjà nommée par le serveur. */
export type MetierARepartir = { id: string; nom: string; icone: string; phrase: string; servira: string | null };

/**
 * US-0312 : celui que « − » remet sans Métier : le dernier arrivé au Territoire de ceux qui exercent le Métier
 * `nom`, soit le plus grand identifiant (les Habitants sont numérotés à leur arrivée), comme la base le choisira ;
 * null quand personne ne l'exerce.
 */
function dernierArrive(habitants: HabitantAffiche[], nom: string): HabitantAffiche | null {
  return habitants.filter((h) => h.metier === nom).reduce<HabitantAffiche | null>((dernier, h) => (dernier && dernier.id > h.id ? dernier : h), null);
}

/**
 * Le bloc Métiers de la page Habitants (US-0307) : une ligne par Métier, son icône, son nom, sa phrase et, tant
 * qu'il ne sert à rien, ce qu'il attend.
 *
 * US-0312 : c'est là qu'on répartit les Habitants. Au bout de chaque ligne, l'effectif du Métier entre « − » et
 * « + », au pouce. « + » donne le Métier au premier Habitant sans Métier de la liste, et se grise quand il n'en
 * reste aucun ; « − » remet sans Métier le dernier arrivé de ce Métier, et se grise quand personne ne l'exerce.
 * Gratuit et immédiat : l'effectif, les compteurs, la liste et le bandeau des sans Métier suivent aussitôt
 * (HabitantsMontres), le temps que l'action, qui choisit l'Habitant dans la base et jamais dans le navigateur,
 * l'enregistre et relise la page, qui fait alors foi.
 *
 * US-0315 : des « + » rapides prennent chacun le sans Métier suivant de la liste montrée, et « + » se grise dès
 * qu'il n'en reste plus : le navigateur n'en envoie jamais plus qu'il n'en montre. La base, elle, n'en sert jamais
 * plus qu'elle n'en a, même depuis un autre appareil, et la page relue range tout le monde à sa place.
 */
export function RepartitionDesMetiers({ metiers }: { metiers: MetierARepartir[] }) {
  const [affiches, montrerLeMetier] = useHabitantsMontres();
  const [, demarrer] = useTransition();
  // Les sans Métier passent les premiers dans la liste, rangés comme la base les range (HabitantsMontres).
  const premierSansMetier = affiches.find((h) => h.metier === null) ?? null;

  /** Montre aussitôt le Métier de l'Habitant choisi comme la base le choisira, le temps que l'action réponde. */
  function repartir(habitant: HabitantAffiche | null, metier: string | null, action: () => Promise<void>) {
    if (!habitant) return;
    demarrer(async () => {
      montrerLeMetier({ id: habitant.id, metier });
      await action();
    });
  }

  return (
    <Bloc titre="Métiers">
      <ul className={styles.metiers}>
        {metiers.map((m) => {
          const nombre = affiches.filter((h) => h.metier === m.nom).length;
          return (
            <li key={m.id} className={styles.ligneMetier}>
              {/* Le nom est écrit juste à côté : l'icône est muette, pour qu'un lecteur d'écran ne le dise pas deux fois. */}
              <Image src={m.icone} alt="" width={40} height={40} className={styles.iconeMetier} />
              <strong className={styles.nomMetier}>{m.nom}</strong>
              <div className={styles.repartition}>
                <button
                  type="button"
                  className={styles.plusMoins}
                  aria-label={`Un ${m.nom} de moins`}
                  disabled={nombre === 0}
                  onClick={() => repartir(dernierArrive(affiches, m.nom), null, () => retirerDuMetier(m.id))}
                >
                  −
                </button>
                <span className={styles.effectifMetier}>{nombre}</span>
                <button
                  type="button"
                  className={styles.plusMoins}
                  aria-label={`Un ${m.nom} de plus`}
                  disabled={premierSansMetier === null}
                  onClick={() => repartir(premierSansMetier, m.nom, () => ajouterAuMetier(m.id))}
                >
                  +
                </button>
              </div>
              <div className={styles.descriptionMetier}>
                <p className={styles.phraseMetier}>{m.phrase}</p>
                {m.servira ? <p className={styles.servira}>{`Servira ${m.servira}.`}</p> : null}
              </div>
            </li>
          );
        })}
      </ul>
    </Bloc>
  );
}
