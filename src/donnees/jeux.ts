// Les jeux de données de référence, chargés dans cet ordre (les Espèces renvoient aux
// Biomes, aux Raretés et aux Rôles). Chaque story qui en a besoin ajoute le sien.
import { z } from "zod";
import { appliquerBareme, BAREME } from "./bareme";
import { lireJeu, type Jeu } from "./charger";

// Un identifiant stable : minuscules sans accent, chiffres et tirets bas.
const identifiant = z.string().regex(/^[a-z0-9_]+$/, "identifiant en minuscules sans accent (a-z, 0-9, _)");
const nom = z.string().trim().min(1, "nom affiché manquant");

const variante = z.object({ id: identifiant, nom });
const entreeBiome = z.object({ id: identifiant, nom, variantes: z.array(variante).optional() });
type EntreeBiome = z.infer<typeof entreeBiome>;

export const BIOMES: Jeu<EntreeBiome & { ordre: number }> = {
  nom: "Biomes",
  fichier: "biomes.yaml",
  table: "biome",
  cle: "id",
  // L'ordre d'affichage suit l'ordre du fichier.
  extraire: (brut) => brut.map((b, i) => ({ ...(b as object), ordre: i + 1 })),
  schema: entreeBiome.extend({ ordre: z.number().int() }),
  colonnes: (b) => ({ id: b.id, nom: b.nom, ordre: b.ordre }),
};

type EntreeVariante = { id: string; nom: string; biomeId: string; ordre: number };

export const VARIANTES: Jeu<EntreeVariante> = {
  nom: "Variantes de Biome",
  fichier: "biomes.yaml",
  table: "variante_biome",
  cle: "id",
  extraire: (brut) =>
    brut.flatMap((b) => {
      const biome = b as { id?: unknown; variantes?: unknown };
      if (!Array.isArray(biome.variantes)) return [];
      return biome.variantes.map((v, i) => ({ ...(v as object), biomeId: biome.id, ordre: i + 1 }));
    }),
  schema: z.object({ id: identifiant, nom, biomeId: identifiant, ordre: z.number().int() }),
  colonnes: (v) => ({ id: v.id, biome_id: v.biomeId, nom: v.nom, ordre: v.ordre }),
};

const entreeRarete = z.object({ id: identifiant, nom, s_elevent: z.boolean(), rang: z.number().int() });

export const RARETES: Jeu<z.infer<typeof entreeRarete>> = {
  nom: "Raretés",
  fichier: "raretes.yaml",
  table: "rarete",
  cle: "id",
  // Le rang suit l'ordre du fichier : de la plus banale à la plus rare.
  extraire: (brut) => brut.map((r, i) => ({ ...(r as object), rang: i + 1 })),
  schema: entreeRarete,
  colonnes: (r) => ({ id: r.id, nom: r.nom, rang: r.rang, s_elevent: r.s_elevent }),
};

const entreeRole = z.object({ id: identifiant, nom, phrase: z.string().trim().min(1, "phrase manquante"), ordre: z.number().int() });

export const ROLES: Jeu<z.infer<typeof entreeRole>> = {
  nom: "Rôles",
  fichier: "roles.yaml",
  table: "role",
  cle: "id",
  extraire: (brut) => brut.map((r, i) => ({ ...(r as object), ordre: i + 1 })),
  schema: entreeRole,
  colonnes: (r) => ({ id: r.id, nom: r.nom, phrase: r.phrase, ordre: r.ordre }),
};

const entreeRessource = z.object({
  id: identifiant,
  nom,
  famille: z.enum(["nourriture", "materiaux"], { error: "famille : nourriture ou materiaux" }),
  au_depart: z.number({ error: "au_depart doit être un nombre" }).nonnegative("au_depart ne peut pas être négatif"),
  ordre: z.number().int(),
});

export const RESSOURCES: Jeu<z.infer<typeof entreeRessource>> = {
  nom: "Ressources",
  fichier: "ressources.yaml",
  table: "ressource",
  cle: "id",
  // L'ordre d'affichage suit l'ordre du fichier.
  extraire: (brut) => brut.map((r, i) => ({ ...(r as object), ordre: i + 1 })),
  schema: entreeRessource,
  colonnes: (r) => ({ id: r.id, nom: r.nom, famille: r.famille, ordre: r.ordre, au_depart: r.au_depart }),
};

type EntreeProduction = { biomeId: string; ressourceId: string; parHeure: number };

/** US-0209 : la production horaire de chaque Biome, rangée sous le Biome dans biomes.yaml. */
export const PRODUCTIONS: Jeu<EntreeProduction> = {
  nom: "Productions des Biomes",
  fichier: "biomes.yaml",
  table: "production_biome",
  cle: ["biome_id", "ressource_id"],
  extraire: (brut) =>
    brut.flatMap((b) => {
      const biome = b as { id?: unknown; production?: unknown };
      if (!biome.production || typeof biome.production !== "object") return [];
      return Object.entries(biome.production).map(([ressourceId, parHeure]) => ({ biomeId: biome.id, ressourceId, parHeure }));
    }),
  schema: z.object({
    biomeId: identifiant,
    ressourceId: identifiant,
    parHeure: z.number({ error: "la production doit être un nombre" }).nonnegative("la production ne peut pas être négative"),
  }),
  colonnes: (p) => ({ biome_id: p.biomeId, ressource_id: p.ressourceId, par_heure: p.parHeure }),
};

/** Chaque Biome donne la production des quatre Ressources, et seulement d'elles (US-0209). */
export function verifierProductions(productions: EntreeProduction[], connus: { biomes: string[]; ressources: string[] }): void {
  const erreurs: string[] = [];
  for (const p of productions) {
    if (!connus.ressources.includes(p.ressourceId)) erreurs.push(`${p.biomeId} : Ressource inconnue « ${p.ressourceId} »`);
  }
  for (const biome of connus.biomes) {
    for (const ressource of connus.ressources) {
      if (!productions.some((p) => p.biomeId === biome && p.ressourceId === ressource)) erreurs.push(`${biome} : production de ${ressource} manquante`);
    }
  }
  if (erreurs.length > 0) throw new Error(`biomes.yaml est invalide :\n  ${erreurs.join("\n  ")}`);
}

const positif = (champ: string) => z.number({ error: `${champ} doit être un nombre` }).positive(`${champ} doit être positif`);
const positifOuNul = (champ: string) =>
  z.number({ error: `${champ} doit être un nombre` }).nonnegative(`${champ} ne peut pas être négatif`);

export const entreeEspece = z.object({
  id: identifiant,
  nom,
  /** Les mesures réelles : le barème (ADR 0007) en tire attaque, vie, Places, charge et Entretien. */
  masse_g: positif("masse_g"),
  arme: positifOuNul("arme"),
  venin: z.boolean().optional(),
  vitesse: positif("vitesse"),
  regime: z.enum(["carnivore", "herbivore", "omnivore"], { error: "régime : carnivore, herbivore ou omnivore" }),
  nourriture_g_par_jour: positifOuNul("nourriture_g_par_jour"),
  biome: identifiant,
  rarete: identifiant,
  role: identifiant.optional(),
  illustration: z.string().trim().min(1).optional(),
  source: z.string().trim().min(1).optional(),
});
export type EntreeEspece = z.infer<typeof entreeEspece>;

export const ESPECES: Jeu<EntreeEspece> = {
  nom: "Espèces",
  fichier: "especes.yaml",
  table: "espece",
  cle: "id",
  schema: entreeEspece,
  colonnes: (e) => {
    const c = appliquerBareme({ masseG: e.masse_g, arme: e.arme, venimeux: e.venin, nourritureGParJour: e.nourriture_g_par_jour });
    return {
      id: e.id,
      nom: e.nom,
      attaque: c.attaque,
      vie: c.vie,
      vitesse: e.vitesse,
      charge: c.charge,
      taille: c.taille,
      regime: e.regime,
      entretien_par_heure: c.entretienParHeure,
      biome_id: e.biome,
      rarete_id: e.rarete,
      role_id: e.role ?? null,
      masse_g: e.masse_g,
      facteur_arme: e.arme * (e.venin ? BAREME.venin : 1),
      illustration: e.illustration ?? null,
      source: e.source ?? null,
    };
  },
};

/** Les Espèces ne renvoient qu'à des Biomes, Raretés et Rôles qui existent. */
export function verifierReferences(
  especes: EntreeEspece[],
  connus: { biomes: string[]; raretes: string[]; roles: string[] },
): void {
  const erreurs: string[] = [];
  for (const e of especes) {
    if (!connus.biomes.includes(e.biome)) erreurs.push(`${e.id} : Biome inconnu « ${e.biome} »`);
    if (!connus.raretes.includes(e.rarete)) erreurs.push(`${e.id} : Rareté inconnue « ${e.rarete} »`);
    if (e.role && !connus.roles.includes(e.role)) erreurs.push(`${e.id} : Rôle inconnu « ${e.role} »`);
  }
  if (erreurs.length > 0) throw new Error(`especes.yaml est invalide :\n  ${erreurs.join("\n  ")}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const JEUX: Jeu<any>[] = [BIOMES, VARIANTES, RARETES, ROLES, ESPECES, RESSOURCES, PRODUCTIONS];

/**
 * Lit toutes les données de référence et vérifie qu'elles se tiennent entre elles. La mise en
 * ligne passe par ici avant d'écrire quoi que ce soit en base : une erreur de saisie l'arrête.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lireDonnees(dossier?: string): { jeu: Jeu<any>; entrees: any[] }[] {
  const lots = JEUX.map((jeu) => ({ jeu, entrees: lireJeu(jeu, dossier) }));
  const entrees = <T>(jeu: Jeu<T>) => lots.find((l) => l.jeu === jeu)!.entrees as T[];
  const ids = <T extends { id: string }>(jeu: Jeu<T>) => entrees(jeu).map((e) => e.id);
  verifierReferences(entrees(ESPECES), { biomes: ids(BIOMES), raretes: ids(RARETES), roles: ids(ROLES) });
  verifierProductions(entrees(PRODUCTIONS), { biomes: ids(BIOMES), ressources: ids(RESSOURCES) });
  return lots;
}
