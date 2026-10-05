import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Bloc } from "@/components/Bloc";
import { Grille } from "@/components/Grille";
import { PastilleRarete } from "@/components/PastilleRarete";
import { motDePasseAccepte } from "@/controle/acces";
import { getPool } from "@/db";
import { biomesEnBase, especesEnBase, raretesEnBase, rolesEnBase } from "@/donnees/en-base";
import { couronneEnBase } from "@/monde/en-base";
import { JOURNAL_TACHE_JOURS } from "@/reglages";
import { derniersPassages, type PassageNote } from "@/temps/absents";
import { formaterInstant } from "@/temps/affichage";
import { maintenant, vitesse } from "@/temps/horloge";
import { CarteCouronne } from "./CarteCouronne";
import { FicheEspece } from "./FicheEspece";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Contrôle", robots: { index: false, follow: false } };

const FUSEAU = "Europe/Paris";

/** La page de contrôle interne (US-0034) : le temps du jeu et les données en base. Aucun lien n'y mène. */
export default async function Controle() {
  await connection();
  // Le proxy demande déjà le mot de passe ; la page vérifie à nouveau, au cas où il serait contourné.
  if (!motDePasseAccepte((await headers()).get("authorization"))) notFound();
  const pool = getPool();
  const [passages, biomes, especes, raretes, roles, couronne] = await Promise.all([
    derniersPassages(pool),
    biomesEnBase(pool),
    especesEnBase(pool),
    raretesEnBase(pool),
    rolesEnBase(pool),
    couronneEnBase(pool),
  ]);
  const facteur = vitesse();

  return (
    <main className={styles.page}>
      <h1 className={styles.titre}>Contrôle</h1>
      <Grille>
        <Bloc titre="Heure du jeu" largeur={6}>
          <p className={styles.valeur}>{formaterInstant(maintenant(), FUSEAU)}</p>
          <p className={styles.note}>Heure de Paris.</p>
        </Bloc>
        <Bloc titre="Vitesse du temps" largeur={6} teinte={facteur === 1 ? undefined : "citron"}>
          <p className={styles.valeur}>×{facteur}</p>
          <p className={styles.note}>{facteur === 1 ? "Vitesse normale." : "Temps accéléré."}</p>
        </Bloc>
        <Bloc titre="Derniers passages de la tâche planifiée">
          {passages.length === 0 ? (
            <p className={styles.note}>Aucun passage noté ces {JOURNAL_TACHE_JOURS} derniers jours.</p>
          ) : (
            <div className={styles.defilement}>
              <table className={styles.tableau}>
                <thead>
                  <tr>
                    <th>Début</th>
                    <th>Résultat</th>
                    <th>Rattrapés</th>
                    <th>Restants</th>
                    <th>Durée</th>
                  </tr>
                </thead>
                <tbody>
                  {passages.map((p) => (
                    <tr key={p.debut.toISOString()}>
                      <td>{formaterInstant(p.debut, FUSEAU)}</td>
                      <td className={p.echecs > 0 ? styles.echec : undefined}>{resultat(p)}</td>
                      <td>{p.rattrapes}</td>
                      <td>{p.restants}</td>
                      <td>{(p.dureeMs / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Bloc>
        <Bloc titre={`Couronne${couronne ? ` de ${couronne.monde} · ${couronne.cases.length} Cases` : ""}`}>
          {couronne && couronne.cases.length > 0 ? (
            <CarteCouronne couronne={couronne} noms={Object.fromEntries(biomes.map((b) => [b.id, b.nom]))} />
          ) : (
            <p className={styles.note}>Aucune Case de la Couronne en base : lancez npm run monde:couronne.</p>
          )}
        </Bloc>
        <Bloc titre={`Biomes en base · ${biomes.length}`}>
          {biomes.length === 0 ? (
            <p className={styles.note}>Aucun Biome en base : lancez npm run db:donnees.</p>
          ) : (
            <ul className={styles.liste}>
              {biomes.map((b) => (
                <li key={b.id}>
                  <span className={styles.nom}>{b.nom}</span> <code className={styles.id}>{b.id}</code>
                  {b.variantes.length > 0 ? (
                    <ul className={styles.variantes} aria-label={`Les ${b.variantes.length} formes : ${b.nom}`}>
                      {b.variantes.map((v) => (
                        <li key={v.id}>
                          {v.nom} <code className={styles.id}>{v.id}</code>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Bloc>
        <Bloc titre={`Espèces en base · ${especes.length}`}>
          {especes.length === 0 ? (
            <p className={styles.note}>Aucune Espèce en base : lancez npm run db:donnees.</p>
          ) : (
            especes.map((e) => <FicheEspece key={e.id} espece={e} />)
          )}
        </Bloc>
        <Bloc titre={`Raretés en base · ${raretes.length}`} largeur={6}>
          <ul className={styles.lignes}>
            {raretes.map((r) => (
              <li key={r.id}>
                <PastilleRarete rarete={r} /> <code className={styles.id}>{r.id}</code>
                <span className={styles.note}>
                  rang {r.rang} · {r.selevent ? "s'élèvent" : "ne s'élèvent pas"}
                </span>
              </li>
            ))}
          </ul>
        </Bloc>
        <Bloc titre={`Rôles en base · ${roles.length}`} largeur={6}>
          <ul className={styles.lignes}>
            {roles.map((r) => (
              <li key={r.id}>
                <span className={styles.nom}>{r.nom}</span> <code className={styles.id}>{r.id}</code>
                <span className={styles.note}>{r.phrase}</span>
              </li>
            ))}
          </ul>
        </Bloc>
      </Grille>
    </main>
  );
}

function resultat(p: PassageNote): string {
  if (p.echecs === 0) return "Réussi";
  const raison = p.erreurs[0]?.raison;
  return `${p.echecs} échec${p.echecs > 1 ? "s" : ""}${raison ? ` : ${raison}` : ""}`;
}
