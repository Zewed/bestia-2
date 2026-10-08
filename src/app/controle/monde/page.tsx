import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Bloc } from "@/components/Bloc";
import { Grille } from "@/components/Grille";
import { motDePasseAccepte } from "@/controle/acces";
import { getPool } from "@/db";
import { biomesEnBase } from "@/donnees/en-base";
import { lireVoisinagesInterdits } from "@/donnees/jeux";
import { genererLeMonde, lireUneGraine } from "@/monde/generer";
import { COEUR_SAUVAGE_RAYON, COURONNE_ANNEAUX, JOUEURS_PAR_MONDE, MONDE_RAYON } from "@/reglages";
import { bilanDuMonde, type CaseDeCarte } from "./bilan";
import { CarteDuMonde, couleur } from "./CarteDuMonde";
import { mondeEnBase, mondesEnBase } from "./en-base";
import styles from "./monde.module.css";

export const metadata: Metadata = { title: "Contrôle du Monde", robots: { index: false, follow: false } };

/** Au-delà, la liste des voisinages interdits s'arrête : la carte les montre assez. */
const INTERDITS_AFFICHES = 20;

const nombre = (n: number) => n.toLocaleString("fr-FR");
const pourcent = (part: number) => `${(100 * part).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

/**
 * US-0412 : le Monde entier sur une page de contrôle, pour juger d'un coup d'œil s'il est crédible : généré
 * à la volée d'une graine, sans rien enregistrer, ou lu en base. Réservée aux développeurs, comme /controle.
 */
export default async function ControleDuMonde({ searchParams }: PageProps<"/controle/monde">) {
  await connection();
  // Le proxy demande déjà le mot de passe ; la page vérifie à nouveau, au cas où il serait contourné.
  if (!motDePasseAccepte((await headers()).get("authorization"))) notFound();
  const pool = getPool();
  const { graine: texte, monde: choisi } = await searchParams;
  const [mondes, biomes] = await Promise.all([mondesEnBase(pool), biomesEnBase(pool)]);
  const noms = new Map(biomes.flatMap((b) => [[b.id, b.nom] as const, ...b.variantes.map((v) => [v.id, v.nom] as const)]));
  const nomDe = (id: string) => noms.get(id) ?? id;

  let vue: { titre: string; cases: CaseDeCarte[] } | null = null;
  let erreur: string | null = null;
  let introuvable: string | null = null;
  const graineSaisie = typeof texte === "string" ? texte.trim() : "";
  const mondeId = typeof choisi === "string" && /^\d{1,9}$/.test(choisi) ? Number(choisi) : null;
  if (graineSaisie) {
    let graine: number | null = null;
    try {
      graine = lireUneGraine(graineSaisie);
    } catch (e) {
      erreur = e instanceof Error ? e.message : String(e);
    }
    if (graine !== null) vue = { titre: `Graine ${graine} · à la volée`, cases: genererLeMonde({ rayon: MONDE_RAYON, anneaux: COURONNE_ANNEAUX, rayonCoeur: COEUR_SAUVAGE_RAYON, graine }) };
  } else if (mondeId !== null) {
    const monde = await mondeEnBase(pool, mondeId);
    if (monde) vue = { titre: `${monde.nom} · ${monde.graine === null ? "sans graine" : `graine ${monde.graine}`} · en base`, cases: monde.cases };
    else introuvable = `Aucun Monde n° ${mondeId} en base.`;
  }
  const bilan = vue ? bilanDuMonde(vue.cases, lireVoisinagesInterdits()) : null;

  return (
    <main className={styles.page}>
      <header className={styles.entete}>
        <h1 className={styles.titre}>Monde</h1>
        <Link href="/controle" className={styles.retour}>
          Contrôle
        </Link>
      </header>
      <Grille>
        <Bloc titre="Graine" largeur={6}>
          <form className={styles.graine} action="/controle/monde">
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
              Générer
            </button>
            {erreur ? (
              <p id="graine-erreur" className={styles.erreur} role="alert">
                {erreur}
              </p>
            ) : null}
          </form>
        </Bloc>
        <Bloc titre={`Mondes en base · ${mondes.length}`} largeur={6}>
          <ul className={styles.mondes}>
            {mondes.map((m) => (
              <li key={m.id}>
                <Link href={`/controle/monde?monde=${m.id}`} aria-current={m.id === mondeId && !graineSaisie ? "page" : undefined}>
                  {m.nom}
                </Link>{" "}
                <span className={styles.note}>
                  {m.graine === null ? "sans graine" : `graine ${m.graine}`} · {nombre(m.cases)} Cases
                </span>
              </li>
            ))}
          </ul>
          {introuvable ? <p className={styles.erreur}>{introuvable}</p> : null}
        </Bloc>
        {vue && bilan ? (
          <Bloc titre={vue.titre}>
            <div className={styles.vue}>
              <CarteDuMonde titre={`Le Monde, ${vue.titre}, ${nombre(vue.cases.length)} Cases`} cases={vue.cases} emplacements={bilan.emplacements} foyers={bilan.foyers} />
              <div className={styles.chiffres}>
                <ul className={styles.legende}>
                  <li>
                    <span className={`${styles.pastille} ${styles.cerclee}`} aria-hidden="true" />
                    Couronne
                    <span className={styles.note}>{nombre(vue.cases.filter((c) => c.couronne).length)}</span>
                  </li>
                  <li>
                    <span className={`${styles.pastille} ${styles.pointillee}`} aria-hidden="true" />
                    Cœur sauvage
                    <span className={styles.note}>{nombre(vue.cases.filter((c) => c.coeur).length)}</span>
                  </li>
                  <li>
                    <span className={`${styles.pastille} ${styles.point}`} aria-hidden="true" />
                    Cases de naissance libres
                    {/* US-0413 : moins de places qu'il n'en faut pour 90 joueurs, le nombre passe en couleur de danger. */}
                    <span className={[styles.note, bilan.emplacements.length + bilan.foyers.length < JOUEURS_PAR_MONDE && styles.alerte].filter(Boolean).join(" ")}>
                      {bilan.emplacements.length}
                    </span>
                  </li>
                  {bilan.foyers.length > 0 ? (
                    <li>
                      <span className={`${styles.pastille} ${styles.plein}`} aria-hidden="true" />
                      Foyers
                      <span className={styles.note}>{bilan.foyers.length}</span>
                    </li>
                  ) : null}
                </ul>
                <div>
                  <h3 className={styles.sousTitre}>Terre</h3>
                  <ul className={styles.legende}>
                    {bilan.biomes.map((b) => (
                      <li key={b.biome}>
                        <span className={styles.pastille} style={{ background: couleur(b.biome) }} aria-hidden="true" />
                        {nomDe(b.biome)}
                        <span className={styles.note}>{pourcent(b.part)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className={styles.sousTitre}>Eau</h3>
                  <ul className={styles.legende}>
                    {bilan.eaux.map((e) => (
                      <li key={e.variante}>
                        <span className={styles.pastille} style={{ background: couleur(e.variante) }} aria-hidden="true" />
                        {nomDe(e.variante)}
                        <span className={styles.note}>{nombre(e.cases)} Cases</span>
                      </li>
                    ))}
                  </ul>
                  <p className={styles.note}>
                    Lacs : {bilan.lacs} · Rivières : {bilan.rivieres}
                  </p>
                </div>
                <div>
                  <h3 className={styles.sousTitre}>Voisinages interdits</h3>
                  {bilan.interdits.length === 0 ? (
                    <p>Aucun</p>
                  ) : (
                    <ul className={`${styles.interdits} ${styles.alerte}`}>
                      {bilan.interdits.slice(0, INTERDITS_AFFICHES).map((v) => (
                        <li key={v}>{v}</li>
                      ))}
                      {bilan.interdits.length > INTERDITS_AFFICHES ? <li>et {bilan.interdits.length - INTERDITS_AFFICHES} autres</li> : null}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </Bloc>
        ) : null}
      </Grille>
    </main>
  );
}
