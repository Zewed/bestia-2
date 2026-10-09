import { Bloc } from "@/components/Bloc";
import styles from "./SansEscorte.module.css";

/**
 * US-0909 : l'escorte d'une Expédition qui part sans Bête, là où la choisir (US-0904) : rien à choisir, une phrase qui dit
 * qu'elle ne ramènera que des Bêtes communes (la règle arrive avec l'étape 40). Le départ n'exige pas d'escorte :
 * un explorateur suffit.
 */
export function SansEscorte() {
  return (
    <Bloc titre="Escorte" className={styles.bloc}>
      <p>Sans escorte, l&apos;Expédition ne ramènera que des Bêtes communes.</p>
    </Bloc>
  );
}
