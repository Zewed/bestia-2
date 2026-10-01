import styles from "./BarreHaut.module.css";

/** La barre du haut, sur chaque page. Le logo et les informations du joueur viendront s'y ranger. */
export function BarreHaut() {
  return <header className={styles.barre} />;
}
