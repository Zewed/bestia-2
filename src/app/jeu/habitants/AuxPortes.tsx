import { Bloc } from "@/components/Bloc";
import styles from "./AuxPortes.module.css";

/** Un Voyageur tel que la partie « Aux portes » le montre : son prénom et l'heure du jeu de son arrivée. */
export type VoyageurAffiche = { id: number; prenom: string; arriveLe: Date };

/** US-0332 : depuis quand un Voyageur attend, en temps du jeu : « arrivé à l'instant », « arrivé il y a 12 min », « arrivé il y a 2 h ». */
function depuisQuand(ms: number): string {
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "arrivé à l'instant";
  if (minutes < 60) return `arrivé il y a ${minutes} min`;
  return `arrivé il y a ${Math.floor(minutes / 60)} h`;
}

/**
 * US-0332 : la partie « Aux portes » de la page Habitants : une ligne par Voyageur qui attend, dans l'ordre
 * de la lecture, du premier arrivé au dernier, avec son prénom et depuis quand il attend, à l'heure du jeu
 * `maintenant` ; « Personne aux portes pour l'instant. » quand personne n'attend. En tête de la colonne sur
 * ordinateur ; au-dessus de la liste quand la colonne passe dessous (AuxPortes.module.css), car un Voyageur
 * n'attend pas toujours.
 */
export function AuxPortes({ voyageurs, maintenant }: { voyageurs: VoyageurAffiche[]; maintenant: Date }) {
  return (
    <Bloc titre="Aux portes" className={styles.auxPortes}>
      {voyageurs.length > 0 ? (
        <ul className={styles.voyageurs}>
          {voyageurs.map((v) => (
            <li key={v.id} className={styles.voyageur}>
              <span className={styles.prenom}>{v.prenom}</span>
              <span className={styles.arrivee}>{depuisQuand(maintenant.getTime() - v.arriveLe.getTime())}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.personne}>Personne aux portes pour l&apos;instant.</p>
      )}
    </Bloc>
  );
}
