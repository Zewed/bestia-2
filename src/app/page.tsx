import { Illustration } from "@/components/Illustration";
import styles from "./page.module.css";

const TUILE = "(max-width: 820px) 50vw, (max-width: 1100px) 33vw, 220px";

export default function Accueil() {
  return (
    <main className={styles.accueil}>
      <div>
        <span className={styles.badge}>Ouverture prochaine</span>
        <h1 className={styles.titre}>Un monde sauvage, des bêtes à apprivoiser.</h1>
        <p className={styles.intro}>
          Faites votre sac : l&apos;aventure vous attend.
        </p>
      </div>

      <div className={styles.mosaique}>
        <div className={`${styles.tuile} ${styles.monde}`}>
          <Illustration
            chemin="accueil/plateau.webp"
            alt="Le monde de Bestia, sculpté comme un plateau de jeu : montagnes enneigées, forêts, savane, désert, jungle et, au centre, le Cœur sauvage"
            sizes="(max-width: 1100px) 100vw, 450px"
            prioritaire
            className={styles.remplir}
          />
        </div>
        <div className={styles.tuile}>
          <Illustration chemin="accueil/mammouth.webp" alt="Un mammouth dans la neige au coucher du soleil" sizes={TUILE} className={styles.remplir} />
        </div>
        <div className={`${styles.tuile} ${styles.chiffre}`}>
          <b>2000+</b>
          <span>espèces à découvrir</span>
        </div>
        <div className={styles.tuile}>
          <Illustration chemin="prototype/ships/lightFighter.webp" alt="Un jeune loup qui hurle dans la forêt" sizes={TUILE} className={styles.remplir} />
        </div>
        <div className={styles.tuile}>
          <Illustration chemin="accueil/castors.webp" alt="Trois castors construisent un barrage" sizes={TUILE} className={styles.remplir} />
        </div>
        <div className={styles.tuile}>
          <Illustration chemin="accueil/explorateurs.webp" alt="Deux explorateurs et leur lama découvrent une vallée" sizes={TUILE} className={styles.remplir} />
        </div>
      </div>
    </main>
  );
}
