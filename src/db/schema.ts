// La structure de la base. Chaque table arrive avec la story qui en a besoin ;
// tout changement passe par une migration :
//   npm run db:generate   écrit la migration à partir de ce fichier
//   npm run db:migrate    l'applique
import { bigint, boolean, check, doublePrecision, index, integer, jsonb, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
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

/** Un Biome : le milieu naturel d'une Case. Son identifiant ne change plus une fois choisi. */
export const biome = pgTable("biome", {
  id: text("id").primaryKey(),
  nom: text("nom").notNull(),
  ordre: integer("ordre").notNull(),
});

/** Une variante de Biome : l'eau se décline en côte, lac, rivière et mer, toutes de même Biome. */
export const varianteBiome = pgTable("variante_biome", {
  id: text("id").primaryKey(),
  biomeId: text("biome_id")
    .notNull()
    .references(() => biome.id),
  nom: text("nom").notNull(),
  ordre: integer("ordre").notNull(),
});

/**
 * Une Rareté : le rang d'une Espèce, qui dit à la fois sa puissance et la difficulté à la
 * trouver. Le rang permet de comparer deux Raretés ; les mythiques ne s'élèvent pas.
 */
export const rarete = pgTable("rarete", {
  id: text("id").primaryKey(),
  nom: text("nom").notNull(),
  rang: integer("rang").notNull().unique(),
  selevent: boolean("s_elevent").notNull(),
});

/** Un Rôle : un usage particulier qu'ont certaines Espèces en plus du combat. */
export const role = pgTable("role", {
  id: text("id").primaryKey(),
  nom: text("nom").notNull(),
  phrase: text("phrase").notNull(),
  ordre: integer("ordre").notNull(),
});

export const regime = pgEnum("regime", ["carnivore", "herbivore", "omnivore"]);

/**
 * Une Espèce : la fiche commune à toutes ses Bêtes, qui sont identiques. Ses chiffres
 * sont calqués sur l'animal réel (la source peut être notée).
 */
export const espece = pgTable(
  "espece",
  {
    id: text("id").primaryKey(),
    nom: text("nom").notNull(),
    attaque: doublePrecision("attaque").notNull(),
    vie: doublePrecision("vie").notNull(),
    vitesse: doublePrecision("vitesse").notNull(),
    charge: doublePrecision("charge").notNull(),
    /** Le nombre de Places qu'une Bête occupe dans un Habitat. */
    taille: doublePrecision("taille").notNull(),
    regime: regime("regime").notNull(),
    /** La Nourriture qu'une Bête consomme chaque heure. */
    entretienParHeure: doublePrecision("entretien_par_heure").notNull(),
    biomeId: text("biome_id")
      .notNull()
      .references(() => biome.id),
    rareteId: text("rarete_id")
      .notNull()
      .references(() => rarete.id),
    /** Au plus un Rôle, ou aucun. */
    roleId: text("role_id").references(() => role.id),
    /** Les mesures réelles d'où le barème tire les caractéristiques (ADR 0007). */
    masseG: doublePrecision("masse_g"),
    facteurArme: doublePrecision("facteur_arme"),
    illustration: text("illustration"),
    source: text("source"),
  },
  (t) => [
    check("espece_attaque_positive", sql`${t.attaque} >= 0`),
    check("espece_vie_positive", sql`${t.vie} > 0`),
    check("espece_vitesse_positive", sql`${t.vitesse} > 0`),
    check("espece_charge_positive", sql`${t.charge} >= 0`),
    check("espece_taille_positive", sql`${t.taille} > 0`),
    check("espece_entretien_positif", sql`${t.entretienParHeure} >= 0`),
  ],
);

/** Les Espèces proposées comme Couple de départ, dans l'ordre où le nouveau joueur les voit. */
export const coupleDeDepart = pgTable("couple_de_depart", {
  especeId: text("espece_id")
    .primaryKey()
    .references(() => espece.id),
  ordre: integer("ordre").notNull().unique(),
  style: text("style").notNull(),
  phrase: text("phrase").notNull(),
});

/**
 * Un compte : son adresse e-mail et l'empreinte de son mot de passe (US-0107), jamais le mot
 * de passe lui-même. La base refuse une adresse avec des majuscules ou des espaces (US-0104) : elle est
 * toujours enregistrée sous sa forme normale, donc deux écritures d'une même adresse
 * tombent sur le même compte, et l'unicité vaut sans tenir compte des majuscules.
 */
export const compte = pgTable(
  "compte",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    email: text("email").notNull().unique(),
    /** L'empreinte scrypt du mot de passe (src/comptes/empreinte.ts). */
    empreinteMotDePasse: text("empreinte_mot_de_passe").notNull(),
    creeLe: timestamp("cree_le", { withTimezone: true }).notNull().defaultNow(),
    /** US-0114 : quand l'adresse a été confirmée, ou null tant qu'elle ne l'est pas. */
    emailConfirmeLe: timestamp("email_confirme_le", { withTimezone: true }),
    /** US-0116 : la dernière connexion, ou null avant la première. */
    derniereConnexionLe: timestamp("derniere_connexion_le", { withTimezone: true }),
  },
  (t) => [
    check("compte_email_normalise", sql`${t.email} = lower(${t.email}) and ${t.email} !~ '[[:space:]]'`),
    // Garde-fou : rien d'autre qu'une empreinte ne peut entrer, jamais un mot de passe en clair.
    check("compte_empreinte_scrypt", sql`${t.empreinteMotDePasse} ~ '^scrypt\\$[0-9]+\\$[0-9]+\\$[0-9]+\\$[A-Za-z0-9+/=]+\\$[A-Za-z0-9+/=]+$'`),
  ],
);

/**
 * Les inscriptions de la dernière heure, par empreinte de connexion (US-0112), pour freiner
 * les inscriptions en rafale. Jamais l'adresse réseau elle-même ; une ligne vit une heure.
 */
export const inscriptionRecente = pgTable(
  "inscription_recente",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    empreinteReseau: text("empreinte_reseau").notNull(),
    le: timestamp("le", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("inscription_recente_par_connexion").on(t.empreinteReseau, t.le)],
);

/**
 * Un lien de confirmation d'adresse (US-0114) : à usage unique, valable un temps limité. Le
 * jeton du lien n'est jamais gardé, seulement son empreinte.
 */
export const lienConfirmation = pgTable(
  "lien_confirmation",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    compteId: integer("compte_id")
      .notNull()
      .references(() => compte.id, { onDelete: "cascade" }),
    empreinteJeton: text("empreinte_jeton").notNull().unique(),
    creeLe: timestamp("cree_le", { withTimezone: true }).notNull().defaultNow(),
    expireLe: timestamp("expire_le", { withTimezone: true }).notNull(),
    utiliseLe: timestamp("utilise_le", { withTimezone: true }),
  },
  (t) => [index("lien_confirmation_par_compte").on(t.compteId, t.creeLe)],
);

/**
 * Une session (US-0116) : ce qui garde un joueur connecté. Le navigateur garde un jeton tiré
 * au hasard dans un cookie ; la base n'en garde que l'empreinte.
 */
export const session = pgTable(
  "session",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    compteId: integer("compte_id")
      .notNull()
      .references(() => compte.id, { onDelete: "cascade" }),
    empreinteJeton: text("empreinte_jeton").notNull().unique(),
    creeLe: timestamp("cree_le", { withTimezone: true }).notNull().defaultNow(),
    expireLe: timestamp("expire_le", { withTimezone: true }).notNull(),
  },
  (t) => [index("session_par_compte").on(t.compteId)],
);
