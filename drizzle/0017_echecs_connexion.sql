CREATE TABLE "echec_connexion" (
	"empreinte_adresse" text PRIMARY KEY NOT NULL,
	"echecs" integer NOT NULL,
	"dernier_echec" timestamp with time zone DEFAULT now() NOT NULL,
	"bloque_jusqua" timestamp with time zone
);
