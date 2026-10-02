// La structure de la base. Chaque table arrive avec la story qui en a besoin ;
// tout changement passe par une migration :
//   npm run db:generate   écrit la migration à partir de ce fichier
//   npm run db:migrate    l'applique
import { bigint, check, doublePrecision, index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/** Un Monde : il naît une fois et ne se réinitialise jamais (la base refuse de l'effacer). */
export const monde = pgTable("monde", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  nom: text("nom").notNull().unique(),
  neLe: timestamp("ne_le", { withTimezone: true }).notNull().defaultNow(),
  /** Le marque-page du temps : l'instant jusqu'auquel le Monde a été calculé. Il ne recule jamais. */
  calculeJusquA: timestamp("calcule_jusqu_a", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Un événement daté qui touche un élément du jeu (une Attaque qui arrive, une Bête qui guérit…).
 * Le temps qui avance le traite à son instant exact, dans l'ordre des dates, une seule fois.
 */
export const evenement = pgTable(
  "evenement",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    element: text("element").notNull(),
    elementId: integer("element_id").notNull(),
    survientLe: timestamp("survient_le", { withTimezone: true }).notNull(),
    type: text("type").notNull(),
    donnees: jsonb("donnees").notNull().default({}),
    traiteLe: timestamp("traite_le", { withTimezone: true }),
  },
  (t) => [index("evenement_a_traiter").on(t.element, t.elementId, t.survientLe)],
);

/** La trace de chaque passage de la tâche planifiée (US-0029), gardée 7 jours. */
export const passageTache = pgTable("passage_tache", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  debut: timestamp("debut", { withTimezone: true }).notNull(),
  dureeMs: integer("duree_ms").notNull(),
  rattrapes: integer("rattrapes").notNull(),
  echecs: integer("echecs").notNull(),
  restants: integer("restants").notNull(),
  erreurs: jsonb("erreurs").notNull().default([]),
});

/**
 * La vitesse du temps du jeu et son point d'ancrage (US-0030), une seule ligne. À chaque
 * changement de vitesse, l'ancre passe à l'heure du jeu du moment : elle ne recule jamais.
 * La production ne la lit pas : son temps passe toujours à vitesse normale.
 */
export const horloge = pgTable(
  "horloge",
  {
    id: integer("id").primaryKey().default(1),
    facteur: doublePrecision("facteur").notNull().default(1),
    reelAncre: timestamp("reel_ancre", { withTimezone: true }).notNull(),
    jeuAncre: timestamp("jeu_ancre", { withTimezone: true }).notNull(),
  },
  (t) => [check("horloge_une_seule_ligne", sql`${t.id} = 1`), check("horloge_facteur_positif", sql`${t.facteur} > 0`)],
);
