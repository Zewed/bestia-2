import type { Stock } from "@/monde/stocks";
import { quantiteAffichee } from "@/monde/quantite";
import styles from "./BarreHaut.module.css";

/**
 * Les quatre ressources du joueur dans la barre du haut (US-0203), toujours dans l'ordre Viande,
 * Végétaux, Bois, Pierre : leur nom en petit, la quantité dessous. Au milieu de la barre ; sur
 * mobile, en bande juste en dessous (la bande compte dans la hauteur de la barre, voir formes.css).
 */
export function Ressources({ stocks }: { stocks: Stock[] }) {
  return (
    <ul className={styles.ressources} aria-label="Ressources" data-bande-ressources="">
      {stocks.map((stock) => (
        <li key={stock.id} className={styles.ressource}>
          <span className={styles.nomRessource}>{stock.nom}</span>
          <span className={styles.quantite}>{quantiteAffichee(stock.quantite)}</span>
        </li>
      ))}
    </ul>
  );
}
