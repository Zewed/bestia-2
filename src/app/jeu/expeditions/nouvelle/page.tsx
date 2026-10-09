import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { exigerCompte } from "@/comptes/garde";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { Bloc } from "@/components/Bloc";
import { getPool } from "@/db";
import { destinationDUneCase } from "@/expeditions/destination";
import { explorateursDuTerritoire } from "@/monde/explorateurs";
import type { Fiche, FicheInconnue } from "@/monde/fiche";
import { type Coordonnees, coordonneeValable } from "@/monde/hex";
import { Explorateurs } from "./Explorateurs";
import { Partir } from "./Partir";
import styles from "./page.module.css";
import { SansEscorte } from "./SansEscorte";
import { Sejour } from "./Sejour";
import { VersLaCarte } from "./VersLaCarte";

export const metadata: Metadata = { title: "Nouvelle Expédition" };

/** L'écran d'Expédition, où mènent la fiche d'une Case et la navigation. */
const ECRAN = "/jeu/expeditions/nouvelle";

/** Une coordonnée de l'adresse (« -5 »), si c'est un entier que la base peut tenir ; null sinon. */
function coordonnee(texte: string | string[] | undefined): number | null {
  if (typeof texte !== "string" || !/^-?\d{1,10}$/.test(texte)) return null;
  const n = Number(texte);
  return coordonneeValable(n) ? n : null;
}

/** US-0901 : la Case en paramètre de l'adresse (« ?q=3&r=-5 »), ou null si l'une de ses coordonnées manque ou est fausse. */
function caseEnParametre(recherche: { q?: string | string[]; r?: string | string[] }): Coordonnees | null {
  const [q, r] = [coordonnee(recherche.q), coordonnee(recherche.r)];
  return q === null || r === null ? null : { q, r };
}

/** « 7 Cases de votre Foyer », « 1 Case de votre Foyer ». */
const casesDuFoyer = (n: number) => `${n} Case${n > 1 ? "s" : ""} de votre Foyer`;

/** US-0901 : la destination choisie : son Biome, « inconnu » sous le brouillard (US-0907), et sa distance au Foyer. */
function Destination({ fiche }: { fiche: Fiche | FicheInconnue }) {
  return (
    <dl className={styles.details}>
      <div>
        <dt>Biome</dt>
        <dd>{"inconnue" in fiche ? "inconnu" : fiche.biome}</dd>
      </div>
      <div>
        <dt>Distance</dt>
        <dd>{casesDuFoyer(fiche.distance)}</dd>
      </div>
    </dl>
  );
}

/**
 * US-0901 : l'écran d'Expédition, une page du jeu. Depuis la fiche d'une Case, la Case est en paramètre et devient la
 * destination, lue dans le Monde du Territoire de la garde, jamais dans l'adresse, qui ne dit que la Case. Depuis la
 * navigation, sans Case, il n'a pas de destination et mène à la carte pour en choisir une ; de même pour une Case que
 * l'adresse dit mal ou que le Monde n'a pas. US-0907 : la carte s'ouvre pour choisir la destination, et la Case qu'on
 * y touche revient ici ; une destination déjà choisie se change de même. Une Case d'un Territoire, le sien (son Foyer
 * compris) ou celui d'un autre joueur, est refusée par un message, à la place de la destination. Sur un téléphone,
 * une seule colonne, et chaque choix au pouce. Sans session, la garde mène à la connexion, qui ramène ici avec la
 * même Case.
 */
export default async function NouvelleExpedition({ searchParams }: PageProps<"/jeu/expeditions/nouvelle">) {
  await connection();
  if (!entreeDuJeuOuverte()) notFound();
  const laCase = caseEnParametre(await searchParams);
  const { territoireId } = await exigerCompte(laCase ? `${ECRAN}?q=${laCase.q}&r=${laCase.r}` : ECRAN);
  const destination = laCase && territoireId !== null ? await destinationDUneCase(getPool(), territoireId, laCase) : null;
  // US-0902 : les explorateurs libres sur total, lus à chaque affichage ; aucun pour un chef sans Territoire.
  const explorateurs = territoireId !== null ? await explorateursDuTerritoire(getPool(), territoireId) : { libres: 0, total: 0 };
  return (
    <main className={styles.page}>
      <h1 className={styles.titre}>Nouvelle Expédition</h1>
      <Bloc titre="Destination">
        {destination && "fiche" in destination ? (
          <>
            <Destination fiche={destination.fiche} />
            <VersLaCarte className={`${styles.choisir} ${styles.changer}`}>Changer de destination</VersLaCarte>
          </>
        ) : (
          <>
            {destination ? <p className={styles.refus}>{destination.refus}</p> : <p className={styles.aucune}>Aucune destination</p>}
            <VersLaCarte className={styles.choisir}>Choisir sur la carte</VersLaCarte>
          </>
        )}
      </Bloc>
      <Explorateurs {...explorateurs} />
      {/* US-0909 : sans Bête, l'Expédition part sans escorte, et l'écran le dit là où se choisira l'escorte (US-0904). */}
      <SansEscorte />
      <Sejour />
      <Partir libres={explorateurs.libres} />
    </main>
  );
}
