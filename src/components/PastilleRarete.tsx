import styles from "./PastilleRarete.module.css";

/** Le nom d'une Rareté sur ses couleurs de la palette ; une Rareté sans couleurs reste neutre. */
export function PastilleRarete({ rarete }: { rarete: { id: string; nom: string } }) {
  return (
    <span className={styles.pastille} data-rarete={rarete.id}>
      {rarete.nom}
    </span>
  );
}
