import { Bloc } from "@/components/Bloc";
import { Grille } from "@/components/Grille";
import { Illustration } from "@/components/Illustration";
import styles from "./page.module.css";

const COULOIRS = [
  {
    teinte: "menthe",
    titre: "Apprivoiser",
    illustration: "prototype/ships/lightFighter.webp",
    nom: "Croiser des Bêtes",
    phrase: "Une Bête sauvage vous suit si votre escorte est assez forte.",
  },
  {
    teinte: "lilas",
    titre: "Élever",
    illustration: "prototype/buildings/shipyard.webp",
    nom: "Réunir un Couple",
    phrase: "Un mâle et une femelle, et l'Espèce s'élève pour toujours.",
  },
  {
    teinte: "ciel",
    titre: "Explorer",
    illustration: "prototype/misc/expedition.webp",
    nom: "Partir en Expédition",
    phrase: "Jusqu'au Cœur sauvage, où vivent les plus rares.",
  },
] as const;

const BIENTOT = ["Créer son compte", "Choisir son nom de chef", "Choisir son Couple de départ : souris, poule ou pigeon"];

export default function Accueil() {
  return (
    <main className={styles.accueil}>
      <Grille>
        <Bloc largeur={7} plein className={styles.hero}>
          <Illustration
            chemin="prototype/misc/hero.webp"
            alt="Des Bêtes de toutes tailles, du loup au mammouth, devant un dragon"
            sizes="(max-width: 1100px) 100vw, 60vw"
            prioritaire
            className={styles.heroImage}
          />
          <div className={styles.cartouche}>
            <h1>Bestia</h1>
            <p>Un monde sauvage qui ne s&apos;arrête jamais.</p>
          </div>
        </Bloc>

        <Bloc largeur={5} teinte="peche" titre="Le jeu">
          <p className={styles.pitch}>
            Parcourez un Monde partagé avec d&apos;autres chefs, croisez des Bêtes sauvages, du scarabée au mammouth, et
            réunissez un mâle et une femelle de chaque Espèce pour les élever sans fin.
          </p>
          <p className={styles.note}>Les inscriptions ouvrent bientôt.</p>
        </Bloc>

        {COULOIRS.map((c) => (
          <Bloc key={c.titre} largeur={4} teinte={c.teinte} titre={c.titre}>
            <div className={styles.ligne}>
              <Illustration chemin={c.illustration} alt="" sizes="54px" className={styles.vignette} />
              <span>
                <b>{c.nom}</b>
                <small>{c.phrase}</small>
              </span>
            </div>
          </Bloc>
        ))}

        <Bloc teinte="encre" titre="Bientôt">
          <ol className={styles.bientot}>
            {BIENTOT.map((etape, i) => (
              <li key={etape}>
                <span>{i + 1}</span>
                {etape}
              </li>
            ))}
          </ol>
        </Bloc>
      </Grille>
    </main>
  );
}
