import { IllustrationEspece } from "@/components/IllustrationEspece";
import { PastilleRarete } from "@/components/PastilleRarete";
import type { EspeceEnBase } from "@/donnees/en-base";
import styles from "./page.module.css";

const nombre = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 3 });

/** Une valeur lue en base, ou « vide » en couleur quand la base n'a rien. */
function Valeur({ valeur, unite }: { valeur: string | number | null; unite?: string }) {
  if (valeur === null) return <span className={styles.vide}>vide</span>;
  return (
    <>
      {typeof valeur === "number" ? nombre(valeur) : valeur}
      {unite ? ` ${unite}` : null}
    </>
  );
}

/** Une Espèce telle qu'elle est en base : sa vignette, sa Rareté, son Rôle et toutes ses caractéristiques. */
export function FicheEspece({ espece: e }: { espece: EspeceEnBase }) {
  const caracteristiques: [string, string | number | null, string?][] = [
    ["Attaque", e.attaque],
    ["Vie", e.vie],
    ["Vitesse", e.vitesse, "km/h"],
    ["Charge", e.charge],
    ["Places", e.taille],
    ["Entretien", e.entretienParHeure, "/ h"],
    ["Régime", e.regime],
    ["Masse réelle", e.masseG, "g"],
    ["Arme", e.facteurArme],
  ];
  return (
    <article className={styles.espece}>
      <div className={styles.vignette}>
        <IllustrationEspece espece={e} format="vignette" className={styles.cadreVignette} />
        {e.illustration === null ? (
          <span className={styles.vide} title="Pas d'illustration en base">
            vide
          </span>
        ) : null}
      </div>
      <div>
        <h3 className={styles.nomEspece}>
          {e.nom} <code className={styles.id}>{e.id}</code>
        </h3>
        <p className={styles.etiquettes}>
          <PastilleRarete rarete={e.rarete} />
          <span>{e.role ? e.role.nom : "Aucun Rôle"}</span>
          <span>{e.biome.nom}</span>
        </p>
        <dl className={styles.caracteristiques}>
          {caracteristiques.map(([nom, valeur, unite]) => (
            <div key={nom}>
              <dt>{nom}</dt>
              <dd>
                <Valeur valeur={valeur} unite={unite} />
              </dd>
            </div>
          ))}
        </dl>
        <p className={styles.source}>
          Source : <Valeur valeur={e.source} />
        </p>
      </div>
    </article>
  );
}
