// Le chargement des données de référence (Biomes, Raretés, Rôles, Espèces, Ressources) : des fichiers
// YAML lisibles sans connaître le code, validés, puis écrits en base sans doublon.
import { readFileSync } from "node:fs";
import type { PoolClient } from "pg";
import { parse } from "yaml";
import type { z } from "zod";

/** Un jeu de données : un fichier, sa table, sa clé stable et la forme de chaque entrée. */
export type Jeu<T> = {
  nom: string;
  fichier: string;
  table: string;
  /** La colonne qui identifie une entrée pour toujours (par exemple « id »). */
  cle: string;
  schema: z.ZodType<T>;
  /** Pour tirer les entrées d'un fichier partagé (les variantes rangées sous leur Biome). */
  extraire?: (brut: unknown[]) => unknown[];
  /** Les colonnes écrites en base pour une entrée, clé comprise. */
  colonnes: (entree: T) => Record<string, unknown>;
};

export type Bilan = { ajoutes: number; modifies: number; inchanges: number };

/** Lit un fichier YAML qui contient une liste d'entrées. */
export function lireFichier(chemin: string): unknown[] {
  const contenu = parse(readFileSync(chemin, "utf8"));
  if (!Array.isArray(contenu)) throw new Error(`${chemin} doit contenir une liste d'entrées.`);
  return contenu;
}

/** Valide chaque entrée et refuse les clés en double, avec des messages qui disent où chercher. */
export function valider<T>(jeu: Jeu<T>, brut: unknown[]): T[] {
  const erreurs: string[] = [];
  const entrees: T[] = [];
  const vues = new Set<unknown>();
  brut.forEach((element, i) => {
    const resultat = jeu.schema.safeParse(element);
    if (!resultat.success) {
      for (const probleme of resultat.error.issues) {
        erreurs.push(`entrée n° ${i + 1}${probleme.path.length ? ` (${probleme.path.join(".")})` : ""} : ${probleme.message}`);
      }
      return;
    }
    const cle = jeu.colonnes(resultat.data)[jeu.cle];
    if (vues.has(cle)) erreurs.push(`entrée n° ${i + 1} : la clé « ${String(cle)} » existe déjà`);
    vues.add(cle);
    entrees.push(resultat.data);
  });
  if (erreurs.length > 0) throw new Error(`${jeu.fichier} est invalide :\n  ${erreurs.join("\n  ")}`);
  return entrees;
}

/**
 * Écrit les entrées en base : ajoute les nouvelles, met à jour celles qui ont changé,
 * laisse les autres telles quelles. Relancé, il ne crée jamais de doublon.
 */
export async function chargerJeu<T>(client: PoolClient, jeu: Jeu<T>, entrees: T[]): Promise<Bilan> {
  const bilan: Bilan = { ajoutes: 0, modifies: 0, inchanges: 0 };
  for (const entree of entrees) {
    const colonnes = jeu.colonnes(entree);
    const noms = Object.keys(colonnes);
    const autres = noms.filter((n) => n !== jeu.cle);
    const q = (n: string) => `"${n}"`;
    const miseAJour = autres.length
      ? `do update set ${autres.map((n) => `${q(n)} = excluded.${q(n)}`).join(", ")}
         where (${autres.map((n) => `${q(jeu.table)}.${q(n)}`).join(", ")}) is distinct from (${autres.map((n) => `excluded.${q(n)}`).join(", ")})`
      : "do nothing";
    const { rows } = await client.query<{ ajoute: boolean }>(
      `insert into ${q(jeu.table)} (${noms.map(q).join(", ")})
       values (${noms.map((_, i) => `$${i + 1}`).join(", ")})
       on conflict (${q(jeu.cle)}) ${miseAJour}
       returning (xmax = 0) as ajoute`,
      Object.values(colonnes),
    );
    if (!rows[0]) bilan.inchanges += 1;
    else if (rows[0].ajoute) bilan.ajoutes += 1;
    else bilan.modifies += 1;
  }
  return bilan;
}

/** Lit et valide les entrées d'un jeu depuis son fichier du dossier donnees/. */
export function lireJeu<T>(jeu: Jeu<T>, dossier = "donnees"): T[] {
  const brut = lireFichier(`${dossier}/${jeu.fichier}`);
  return valider(jeu, jeu.extraire ? jeu.extraire(brut) : brut);
}
