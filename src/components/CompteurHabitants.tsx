import Image from "next/image";
import Link from "next/link";
import { quantiteAffichee } from "@/monde/quantite";
import styles from "./BarreHaut.module.css";

/** L'icône des Habitants, du même trait que celles des Ressources. */
const ICONE_DES_HABITANTS = "/illustrations/icones/habitants.webp";

/** « 1 Habitant », « 3 Habitants » : le nombre tel qu'un lecteur d'écran le dit. */
const nombreDHabitants = (nombre: number) => `${nombre} ${nombre > 1 ? "Habitants" : "Habitant"}`;

/**
 * US-0304 : le nombre d'Habitants du joueur, dans la barre du haut juste après ses ressources, séparé
 * d'elles du même trait : leur icône, puis le nombre. Le toucher ouvre la page Habitants, qui en est
 * le détail : pas de bulle. Sur mobile, cinquième colonne de la bande, l'icône au-dessus du nombre.
 */
export function CompteurHabitants({ nombre }: { nombre: number }) {
  return (
    <div className={styles.habitants}>
      <Link href="/jeu/habitants" className={`${styles.boutonRessource} ${styles.lienHabitants}`} aria-label={nombreDHabitants(nombre)}>
        <Image src={ICONE_DES_HABITANTS} alt="Habitants" width={22} height={22} className={styles.icone} />
        <span className={styles.quantite}>{quantiteAffichee(nombre)}</span>
      </Link>
    </div>
  );
}
