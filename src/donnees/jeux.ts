// Les jeux de données de référence, chargés dans cet ordre (les Espèces renvoient aux
// Biomes, aux Raretés et aux Rôles). Chaque story de l'étape 4 ajoute le sien.
import { z } from "zod";
import type { Jeu } from "./charger";

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const JEUX: Jeu<any>[] = [BIOMES, VARIANTES, RARETES, ROLES];
