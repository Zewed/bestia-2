import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { exigerCompte } from "@/comptes/garde";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { Bloc } from "@/components/Bloc";
import { getPool } from "@/db";
import { explorateursDuTerritoire, prochainRetourDUnExplorateur } from "@/monde/explorateurs";
import { type Fiche, type FicheInconnue, ficheDUneCase } from "@/monde/fiche";
import { type Coordonnees, coordonneeValable } from "@/monde/hex";
import { AucunExplorateurLibre } from "./AucunExplorateurLibre";
import { Explorateurs } from "./Explorateurs";
import { Partir } from "./Partir";
import styles from "./page.module.css";

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
 * l'adresse dit mal, que le Monde n'a pas, ou pour le Foyer du joueur, qui ne peut pas être une destination (US-0907).
 * Sur un téléphone, une seule colonne, et chaque choix au pouce. Sans session, la garde mène à la connexion, qui
 * ramène ici avec la même Case.
 */
export default async function NouvelleExpedition({ searchParams }: PageProps<"/jeu/expeditions/nouvelle">) {
  await connection();
  if (!entreeDuJeuOuverte()) notFound();
  const laCase = caseEnParametre(await searchParams);
  const { territoireId } = await exigerCompte(laCase ? `${ECRAN}?q=${laCase.q}&r=${laCase.r}` : ECRAN);
  const fiche = laCase && territoireId !== null ? await ficheDUneCase(getPool(), territoireId, laCase) : null;
  const destination = fiche && fiche.distance > 0 ? fiche : null;
  // US-0902 : les explorateurs libres sur total, lus à chaque affichage ; aucun pour un chef sans Territoire.
  const explorateurs = territoireId !== null ? await explorateursDuTerritoire(getPool(), territoireId) : { libres: 0, total: 0 };
  // US-0903 : sans explorateur libre, un message à la place du formulaire ; l'heure du prochain retour si tous sont partis.
  if (explorateurs.libres === 0) {
    const prochainRetour = explorateurs.total > 0 && territoireId !== null ? await prochainRetourDUnExplorateur(getPool(), territoireId) : null;
    return (
      <main className={styles.page}>
        <h1 className={styles.titre}>Nouvelle Expédition</h1>
        <AucunExplorateurLibre total={explorateurs.total} prochainRetour={prochainRetour} />
      </main>
    );
  }
  return (
    <main className={styles.page}>
      <h1 className={styles.titre}>Nouvelle Expédition</h1>
      <Bloc titre="Destination">
        {destination ? (
          <Destination fiche={destination} />
        ) : (
          <>
            <p className={styles.aucune}>Aucune destination</p>
            <Link href="/jeu/carte" className={styles.choisir}>
              Choisir sur la carte
            </Link>
          </>
        )}
      </Bloc>
      <Explorateurs {...explorateurs} />
      <Partir libres={explorateurs.libres} />
    </main>
  );
}
