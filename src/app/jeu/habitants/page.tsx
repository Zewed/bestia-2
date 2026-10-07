import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { CSSProperties } from "react";
import { exigerCompte, stocksALHeure } from "@/comptes/garde";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { Bloc } from "@/components/Bloc";
import { Grille } from "@/components/Grille";
import { getPool } from "@/db";
import { type EntretienDesHabitants, entretienDesHabitants, habitantsDuTerritoire, placesDuTerritoire } from "@/monde/habitants";
import { iconeDeMetier, lesMetiers, type Metier } from "@/monde/metiers";
import { nourriturePourEncore, tenueDeLaNourriture } from "@/monde/nourriture";
import { quantiteExacte } from "@/monde/quantite";
import type { Stock } from "@/monde/stocks";
import { voyageursAuxPortes } from "@/monde/voyageurs";
import { maintenant, vitesse } from "@/temps/horloge";
import { AuxPortes } from "./AuxPortes";
import { BandeauSansMetier } from "./BandeauSansMetier";
import { HabitantsMontres } from "./HabitantsMontres";
import { ListeDesHabitants } from "./ListeDesHabitants";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Habitants" };

/** « 1 Habitant », « 3 Habitants ». */
function nombreDHabitants(nombre: number): string {
  return `${nombre} ${nombre > 1 ? "Habitants" : "Habitant"}`;
}

/** US-0305 : « 3 Habitants sur 5 places », « 1 Habitant sur 1 place ». */
function habitantsSurPlaces(habitants: number, places: number): string {
  return `${nombreDHabitants(habitants)} sur ${places} ${places > 1 ? "places" : "place"}`;
}

/** US-0318 : le détail de l'Entretien, en une ligne : « 3 Habitants × 2 Nourriture = », puis le total. */
function LigneEntretien({ entretien }: { entretien: EntretienDesHabitants }) {
  return (
    <p className={styles.ligneEntretien}>
      {`${nombreDHabitants(entretien.habitants)} × ${quantiteExacte(String(entretien.parHabitant))} Nourriture = `}
      <strong className={styles.totalEntretien}>{`${quantiteExacte(entretien.parHeure)} Nourriture par heure`}</strong>
    </p>
  );
}

/**
 * US-0320 : sous l'Entretien, combien de temps la Viande et les Végétaux le paieront encore, au rythme du
 * moment : « Nourriture assurée », ou « Nourriture pour encore 7 h », en alerte.
 */
function TenueDeLaNourriture({ stocks, entretien }: { stocks: Stock[]; entretien: EntretienDesHabitants }) {
  const [viande, vegetaux] = stocks
    .filter((s) => s.famille === "nourriture")
    .map((s) => ({ quantite: Number(s.quantite), parHeure: Number(s.parHeure), limite: Number(s.limite) }));
  if (!viande || !vegetaux) return null;
  const heures = nourriturePourEncore(viande, vegetaux, Number(entretien.parHeure));
  return (
    <p className={styles.tenue} data-baisse={heures === null ? undefined : ""}>
      {tenueDeLaNourriture(heures)}
    </p>
  );
}

/**
 * US-0307 : un Métier sur une ligne : son icône, son nom en gras suivi de sa phrase (« Bûcheron rapporte
 * du Bois des forêts »), puis, tant qu'il ne sert à rien, ce qu'il attend, en discret.
 */
function LigneMetier({ metier }: { metier: Metier }) {
  return (
    <li className={styles.ligneMetier}>
      {/* Le nom est écrit juste à côté : l'icône est muette, pour qu'un lecteur d'écran ne le dise pas deux fois. */}
      <Image src={iconeDeMetier(metier.id)} alt="" width={40} height={40} className={styles.iconeMetier} />
      <div>
        <p className={styles.phraseMetier}>
          <strong className={styles.nomMetier}>{metier.nom}</strong>
          {` ${metier.phrase}`}
        </p>
        {metier.servira ? <p className={styles.servira}>{`Servira ${metier.servira}.`}</p> : null}
      </div>
    </li>
  );
}

/**
 * US-0307 : la colonne qui empile l'Entretien puis les Métiers, placée dans la Grille comme un bloc étroit
 * de largeur 4 : à droite de la liste sur ordinateur, une demi-ligne sur tablette, toute la largeur sur mobile.
 */
const COLONNE = { "--largeur": 4 } as CSSProperties;

/**
 * La page Habitants (US-0302), ouverte depuis la navigation : sous le titre, tant qu'il y en a, le bandeau des
 * Habitants sans Métier (US-0313) ; puis leur nombre sur la place du Territoire,
 * avec « Plus de place » quand elle est toute prise (US-0305), leurs effectifs par Métier (US-0309), qui
 * filtrent la liste (US-0314), puis une ligne par Habitant avec son prénom, son Métier et son état, dans
 * l'ordre de la lecture (US-0303), d'où l'on donne un Métier à un Habitant sans Métier (US-0308) ; à côté,
 * ou dessous sur mobile, leur Entretien par heure (US-0318) et combien de temps la Nourriture le paiera
 * (US-0320), d'après les Stocks lus une fois le Territoire mis à l'heure, puis les huit Métiers (US-0307).
 * Tout est lu à chaque affichage.
 * Sans session, la garde mène à la connexion, qui ramène ici.
 */
export default async function Habitants() {
  await connection();
  if (!entreeDuJeuOuverte()) notFound();
  const { territoireId } = await exigerCompte("/jeu/habitants");
  const [habitants, places, entretien, metiers, stocks, voyageurs] = await Promise.all([
    territoireId === null ? [] : habitantsDuTerritoire(getPool(), territoireId),
    territoireId === null ? 0 : placesDuTerritoire(getPool(), territoireId),
    territoireId === null ? null : entretienDesHabitants(getPool(), territoireId),
    lesMetiers(getPool()),
    territoireId === null ? [] : stocksALHeure(territoireId),
    territoireId === null ? [] : voyageursAuxPortes(getPool(), territoireId),
  ]);
  const montres = habitants.map(({ id, prenom, metier, etat }) => ({ id, prenom, metier, etat }));
  return (
    <main className={styles.page}>
      <h1 className={styles.titre}>Habitants</h1>
      {/* US-0313 : le bandeau des sans Métier compte sur les Habitants de la liste, Métier donné d'avance compris. */}
      <HabitantsMontres habitants={montres}>
        <BandeauSansMetier />
        <Grille>
          <Bloc largeur={8} className={styles.liste}>
            <div className={styles.entete}>
              <p className={styles.nombre}>{habitantsSurPlaces(habitants.length, places)}</p>
              {habitants.length >= places ? <p className={styles.plein}>Plus de place</p> : null}
            </div>
            {habitants.length > 0 ? (
              <ListeDesHabitants habitants={montres} metiers={metiers.map(({ id, nom }) => ({ id, nom, icone: iconeDeMetier(id) }))} />
            ) : null}
          </Bloc>
          <div className={styles.colonne} style={COLONNE} data-etroit="">
            {/* US-0332 : les Voyageurs aux portes, en tête de la colonne ; au-dessus de la liste quand la colonne passe dessous. */}
            {/* US-0333 : leur compte à rebours suit le temps du jeu, à sa vitesse ; US-0338 : la place qui reste règle l'accueil. */}
            <AuxPortes voyageurs={voyageurs} maintenant={maintenant()} vitesse={vitesse()} placesLibres={places - habitants.length} />
            {entretien ? (
              <Bloc titre="Entretien">
                <LigneEntretien entretien={entretien} />
                <TenueDeLaNourriture stocks={stocks} entretien={entretien} />
              </Bloc>
            ) : null}
            {metiers.length > 0 ? (
              <Bloc titre="Métiers">
                <ul className={styles.metiers}>
                  {metiers.map((m) => (
                    <LigneMetier key={m.id} metier={m} />
                  ))}
                </ul>
              </Bloc>
            ) : null}
          </div>
        </Grille>
      </HabitantsMontres>
    </main>
  );
}
