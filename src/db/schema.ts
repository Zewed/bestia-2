// La structure de la base. Chaque table arrive avec la story qui en a besoin ;
// tout changement passe par une migration :
//   npm run db:generate   écrit la migration à partir de ce fichier
//   npm run db:migrate    l'applique
import { bigint, boolean, check, doublePrecision, index, integer, jsonb, numeric, pgEnum, pgTable, primaryKey, text, timestamp, unique } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/** Un Monde : il naît une fois et ne se réinitialise jamais (la base refuse de l'effacer). */
export const monde = pgTable("monde", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  nom: text("nom").notNull().unique(),
  neLe: timestamp("ne_le", { withTimezone: true }).notNull().defaultNow(),
  /** Le marque-page du temps : l'instant jusqu'auquel le Monde a été calculé. Il ne recule jamais. */
  calculeJusquA: timestamp("calcule_jusqu_a", { withTimezone: true }).notNull().defaultNow(),
  /** US-0151 : sa taille en anneaux, et combien d'anneaux extérieurs forment sa Couronne. Fixées à la préparation de la Couronne, elles ne changent plus. */
  rayon: integer("rayon"),
  anneauxCouronne: integer("anneaux_couronne"),
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

export const familleDeRessource = pgEnum("famille_de_ressource", ["nourriture", "materiaux"]);

/**
 * Une Ressource (US-0201) : la Viande et les Végétaux sont de la Nourriture, le Bois et la Pierre
 * des Matériaux. L'ordre est celui de l'affichage.
 */
export const ressource = pgTable(
  "ressource",
  {
    id: text("id").primaryKey(),
    nom: text("nom").notNull(),
    famille: familleDeRessource("famille").notNull(),
    ordre: integer("ordre").notNull(),
    /** US-0202 : ce que reçoit un Territoire à sa naissance. */
    auDepart: numeric("au_depart", { precision: 24, scale: 6 }).notNull().default("0"),
  },
  (t) => [check("ressource_au_depart_positif", sql`${t.auDepart} >= 0`)],
);

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

/**
 * Les Espèces autrefois proposées comme Couple de départ. Plus lue depuis le retrait du Couple de
 * départ (ADR 0008), mais gardée : une table ne se supprime pas.
 */
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

/**
 * Les échecs de connexion récents par adresse essayée (US-0118), pour freiner les essais de
 * mot de passe à répétition. L'adresse n'est gardée que sous son empreinte chiffrée ; une ligne
 * s'efface au premier succès, ou un jour après le dernier échec.
 */
export const echecConnexion = pgTable("echec_connexion", {
  empreinteAdresse: text("empreinte_adresse").primaryKey(),
  echecs: integer("echecs").notNull(),
  dernierEchec: timestamp("dernier_echec", { withTimezone: true }).notNull().defaultNow(),
  bloqueJusqua: timestamp("bloque_jusqua", { withTimezone: true }),
});

/**
 * Un lien pour changer de mot de passe (US-0126) : à usage unique, valable peu de temps. Le jeton
 * du lien n'est jamais gardé, seulement son empreinte.
 */
export const lienReinitialisation = pgTable(
  "lien_reinitialisation",
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
  (t) => [index("lien_reinitialisation_par_compte").on(t.compteId, t.creeLe)],
);

/**
 * Le Chef d'un compte dans un Monde (US-0131), sous le nom que voient les autres joueurs. Un
 * compte a au plus un Chef par Monde ; tant qu'il n'en a pas, il ne peut que choisir son nom. Deux
 * Chefs d'un même Monde ne portent jamais des noms jugés identiques (US-0135).
 */
export const chef = pgTable(
  "chef",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    compteId: integer("compte_id")
      .notNull()
      .references(() => compte.id, { onDelete: "cascade" }),
    mondeId: integer("monde_id")
      .notNull()
      .references(() => monde.id),
    /** Le nom tel que le joueur l'a choisi, majuscules comprises. */
    nom: text("nom").notNull(),
    /** US-0135 : sa forme de comparaison (src/chefs/nom.ts, cleDuNom), unique dans le Monde. */
    cleNom: text("cle_nom").notNull(),
    creeLe: timestamp("cree_le", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("chef_un_par_monde").on(t.compteId, t.mondeId),
    unique("chef_nom_unique_dans_le_monde").on(t.mondeId, t.cleNom),
    check("chef_cle_nom_a_plat", sql`${t.cleNom} ~ '^[a-z0-9]+$'`),
  ],
);

/**
 * Les mots interdits dans un nom de chef (US-0138), sous leur forme de comparaison (minuscules,
 * sans accents ni signes). Un mot « entier » n'est refusé que seul, pas caché dans un autre mot
 * (« con » refuse « Le Con », pas « Faucon ») ; les autres sont refusés où qu'ils soient. La liste
 * se modifie directement en base, sans nouvelle version du jeu.
 */
export const motInterdit = pgTable(
  "mot_interdit",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    mot: text("mot").notNull().unique(),
    entier: boolean("entier").notNull().default(false),
    creeLe: timestamp("cree_le", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check("mot_interdit_a_plat", sql`${t.mot} ~ '^[a-z0-9]+$'`)],
);

/**
 * Une Case du Monde (US-0151) : un hexagone repéré par (q, r), le Cœur sauvage en (0, 0), avec son
 * Biome. Une Case créée ne change plus de Biome : la génération du reste du Monde ne fait qu'ajouter
 * les Cases qui manquent.
 */
export const caseDuMonde = pgTable(
  "case_du_monde",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    mondeId: integer("monde_id")
      .notNull()
      .references(() => monde.id),
    q: integer("q").notNull(),
    r: integer("r").notNull(),
    /** La distance au Cœur sauvage, en Cases. */
    anneau: integer("anneau").notNull(),
    /** Si la Case fait partie de la Couronne, où naissent les joueurs. */
    couronne: boolean("couronne").notNull(),
    biomeId: text("biome_id")
      .notNull()
      .references(() => biome.id),
    varianteId: text("variante_id").references(() => varianteBiome.id),
    /** US-0153 : le chef à qui la Case appartient, un seul ; null tant qu'elle est libre. */
    chefId: integer("chef_id").references(() => chef.id, { onDelete: "set null" }),
    /** US-0155 : la Case ne peut pas être prise par un autre joueur (un Foyer). La règle joue à l'étape 59. */
    imprenable: boolean("imprenable").notNull().default(false),
  },
  (t) => [
    unique("case_unique_dans_le_monde").on(t.mondeId, t.q, t.r),
    index("case_par_anneau").on(t.mondeId, t.anneau),
    index("case_par_chef").on(t.chefId),
    check("case_anneau_exact", sql`${t.anneau} = greatest(abs(${t.q}), abs(${t.r}), abs(${t.q} + ${t.r}))`),
  ],
);

/**
 * Le Territoire d'un chef (US-0155) : l'ensemble de ses Cases, d'un seul tenant, autour de son
 * Foyer. Ses Cases sont celles qui portent son chef ; il naît avec une seule, son Foyer.
 */
export const territoire = pgTable("territoire", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  chefId: integer("chef_id")
    .notNull()
    .unique()
    .references(() => chef.id, { onDelete: "cascade" }),
  /** La Case du Foyer, autour de la hutte du chef. */
  foyerCaseId: integer("foyer_case_id")
    .notNull()
    .unique()
    .references(() => caseDuMonde.id),
  neLe: timestamp("ne_le", { withTimezone: true }).notNull().defaultNow(),
  /** US-0156 : le marque-page du temps, réglé sur sa naissance ; il ne recule jamais. */
  calculeJusquA: timestamp("calcule_jusqu_a", { withTimezone: true }).notNull().defaultNow(),
  /** US-0158 : quand le récit d'arrivée a été montré ; null tant qu'il ne l'a pas été. Il ne l'est qu'une fois. */
  recitLuLe: timestamp("recit_lu_le", { withTimezone: true }),
});

/**
 * Le Stock d'une Ressource dans un Territoire (US-0201). Chaque Territoire en a un par Ressource,
 * créé par la base à sa naissance avec la quantité de départ de la Ressource (US-0202). La quantité garde ses fractions au millionième, sans arrondi
 * flottant, et la base la refuse négative.
 */
export const stock = pgTable(
  "stock",
  {
    territoireId: integer("territoire_id")
      .notNull()
      .references(() => territoire.id, { onDelete: "cascade" }),
    ressourceId: text("ressource_id")
      .notNull()
      .references(() => ressource.id),
    quantite: numeric("quantite", { precision: 24, scale: 6 }).notNull().default("0"),
  },
  (t) => [primaryKey({ columns: [t.territoireId, t.ressourceId] }), check("stock_jamais_negatif", sql`${t.quantite} >= 0`)],
);
