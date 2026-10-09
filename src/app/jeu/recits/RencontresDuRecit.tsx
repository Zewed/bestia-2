import { IllustrationEspece } from "@/components/IllustrationEspece";
import { PastilleRarete } from "@/components/PastilleRarete";
import type { Sexe } from "@/monde/betes-sauvages";
import type { IssueDUneRencontre } from "@/monde/recits";
import styles from "./RencontresDuRecit.module.css";

/**
 * US-0940 : une Rencontre telle que le Récit d'un retour la montre : son heure, déjà écrite par le serveur dans le fuseau du
 * joueur, l'Espèce de la Bête avec son illustration et sa Rareté, et ce qu'il en advint.
 */
export type RencontreAffichee = {
  instant: string;
  heure: string;
  nom: string;
  illustration: string | null;
  rarete: { id: string; nom: string };
  issue: IssueDUneRencontre;
  sexe: Sexe | null;
  nouvelleEspece: boolean;
};

const SEXES: Record<Sexe, string> = { male: "mâle", femelle: "femelle" };

/** US-0940 : « Apprivoisée, femelle », « Trop forte, restée sur sa Case », « Repartie à la fin de sa durée ». */
function ceQuIlAdvint({ issue, sexe }: Pick<RencontreAffichee, "issue" | "sexe">): string {
  if (issue === "apprivoisee") return sexe ? `Apprivoisée, ${SEXES[sexe]}` : "Apprivoisée";
  return issue === "restee" ? "Trop forte, restée sur sa Case" : "Repartie à la fin de sa durée";
}

/**
 * US-0940 : le récit de Rencontre : chaque Bête vue, à son heure, dans l'ordre des apparitions, avec la vignette, le nom
 * et la Rareté de son Espèce, puis ce qu'il en advint. Une Bête apprivoisée, ou dont l'Espèce entre au Bestiaire, est mise
 * en avant ; « Nouvelle Espèce au Bestiaire » le dit en toutes lettres. Sur mobile, la vignette se réduit.
 */
export function RencontresDuRecit({ rencontres, id, hidden }: { rencontres: RencontreAffichee[]; id?: string; hidden?: boolean }) {
  return (
    <ol id={id} className={styles.rencontres} hidden={hidden} aria-label="Rencontres">
      {rencontres.map((r, i) => (
        <li key={i} className={styles.rencontre} data-en-avant={r.issue === "apprivoisee" || r.nouvelleEspece ? "" : undefined}>
          <IllustrationEspece espece={r} format="vignette" className={styles.vignette} />
          <div className={styles.corps}>
            <p className={styles.bete}>
              <time className={styles.heure} dateTime={r.instant}>
                {r.heure}
              </time>
              <span className={styles.nom}>{r.nom}</span>
              <PastilleRarete rarete={r.rarete} />
            </p>
            <p className={styles.issue} data-issue={r.issue}>
              {ceQuIlAdvint(r)}
            </p>
            {r.nouvelleEspece ? <p className={styles.nouvelleEspece}>Nouvelle Espèce au Bestiaire</p> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
