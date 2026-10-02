CREATE TABLE "horloge" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"facteur" double precision DEFAULT 1 NOT NULL,
	"reel_ancre" timestamp with time zone NOT NULL,
	"jeu_ancre" timestamp with time zone NOT NULL,
	CONSTRAINT "horloge_une_seule_ligne" CHECK ("horloge"."id" = 1),
	CONSTRAINT "horloge_facteur_positif" CHECK ("horloge"."facteur" > 0)
);
