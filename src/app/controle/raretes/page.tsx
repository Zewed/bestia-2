import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Bloc } from "@/components/Bloc";
import { Grille } from "@/components/Grille";
import { PastilleRarete } from "@/components/PastilleRarete";
import { motDePasseAccepte } from "@/controle/acces";
import { lireJeu } from "@/donnees/charger";
import { RARETES } from "@/donnees/jeux";
import { lireUneGraine } from "@/monde/generer";
import { simulerLesRaretes } from "./simulation";
import styles from "./raretes.module.css";

export const metadata: Metadata = { title: "Raretés par Anneau", robots: { index: false, follow: false } };

const nombre = (n: number) => n.toLocaleString("fr-FR");
const decimales = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const part = (pourcent: number) => `${decimales(pourcent)} %`;

/**
 * US-0931 : la simulation des Raretés par Anneau : pour une graine, les Bêtes sauvages qu'un Monde généré fait apparaître
 * pendant SIMULATION_DES_RARETES_JOURS jours de jeu, la part obtenue de chaque Rareté à côté de la part attendue, Anneau
 * par Anneau, et le résultat du contrôle en tête. Rien n'est lu ni écrit en base. Réservée aux développeurs, comme /controle.
 */
export default async function SimulationDesRaretes({ searchParams }: PageProps<"/controle/raretes">) {
  await connection();
  // Le proxy demande déjà le mot de passe ; la page vérifie à nouveau, au cas où il serait contourné.
  if (!motDePasseAccepte((await headers()).get("authorization"))) notFound();
  const { graine: texte } = await searchParams;
  const graineSaisie = typeof texte === "string" ? texte.trim() : "";
  let graine: number | null = null;
  let erreur: string | null = null;
  if (graineSaisie) {
    try {
      graine = lireUneGraine(graineSaisie);
    } catch (e) {
      erreur = e instanceof Error ? e.message : String(e);
    }
  }
  const simulation = graine === null ? null : simulerLesRaretes({ graine });
  const raretes = new Map(lireJeu(RARETES).map((r) => [r.id, r]));
  const rarete = (id: string) => raretes.get(id) ?? { id, nom: id };
  const derniers = simulation?.anneaux.length ?? 0;
  const echecs = (simulation?.anneaux ?? []).flatMap(({ anneau, raretes: parts, communesMajoritaires }) => [
    ...parts.filter((r) => r.horsTolerance).map((r) => `Anneau ${anneau} · ${rarete(r.rareteId).nom} : ${part(r.obtenue)} au lieu de ${nombre(r.attendue)} %`),
    ...(communesMajoritaires ? [] : [`Anneau ${anneau} · Communes non majoritaires : ${part(parts[0].obtenue)}`]),
  ]);

  return (
    <main className={styles.page}>
      <header className={styles.entete}>
        <h1 className={styles.titre}>Raretés par Anneau</h1>
        <Link href="/controle" className={styles.retour}>
          Contrôle
        </Link>
      </header>
      <Grille>
        <Bloc titre="Graine" largeur={6}>
          <form className={styles.graine} action="/controle/raretes">
            <input
              id="graine"
              name="graine"
              inputMode="numeric"
              autoComplete="off"
              defaultValue={graineSaisie}
              aria-label="Graine"
              aria-invalid={erreur ? true : undefined}
              aria-describedby={erreur ? "graine-erreur" : undefined}
              className={styles.champ}
              required
            />
            <button type="submit" className={styles.bouton}>
              Simuler
            </button>
            {erreur ? (
              <p id="graine-erreur" className={styles.erreur} role="alert">
                {erreur}
              </p>
            ) : null}
          </form>
        </Bloc>
        {simulation ? (
          <>
            <Bloc titre={`Graine ${graine} · ${simulation.jours} jours de jeu`} largeur={6} teinte={simulation.reussie ? "menthe" : "rose"}>
              <p className={styles.valeur}>{simulation.reussie ? "Contrôle réussi" : "Contrôle échoué"}</p>
              {echecs.length > 0 ? (
                <ul className={styles.echecs}>
                  {echecs.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              ) : null}
              <p className={styles.note}>
                {`Tolérance : ${nombre(simulation.tolerance)} point${simulation.tolerance > 1 ? "s" : ""}`}
              </p>
              {/* US-0931 : le rythme visé, une indication pour régler les apparitions, jamais un échec du contrôle. */}
              <p className={styles.note}>Rythme visé : première peu commune en 3 à 4 jours, rare en un mois.</p>
            </Bloc>
            {simulation.anneaux.map((a) => (
              <Bloc key={a.anneau} titre={`Anneau ${a.anneau}${a.anneau === 1 ? " · Couronne" : a.anneau === derniers ? " · Cœur sauvage" : ""}`} largeur={6}>
                <p className={styles.note}>
                  {`${nombre(a.cases)} Cases · ${nombre(a.apparitions)} apparitions · ${decimales(a.parCaseParJour)} par Case et par jour`}
                </p>
                <div className={styles.defilement}>
                  <table className={styles.tableau}>
                    <thead>
                      <tr>
                        <th>Rareté</th>
                        <th>Obtenue</th>
                        <th>Attendue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {a.raretes.map((r, i) => (
                        <tr key={r.rareteId}>
                          <td>
                            <PastilleRarete rarete={rarete(r.rareteId)} />
                          </td>
                          <td className={r.horsTolerance || (i === 0 && !a.communesMajoritaires) ? styles.echec : undefined}>{part(r.obtenue)}</td>
                          <td>{nombre(r.attendue)} %</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Bloc>
            ))}
          </>
        ) : null}
      </Grille>
    </main>
  );
}
