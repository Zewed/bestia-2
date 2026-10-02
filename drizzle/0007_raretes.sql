CREATE TABLE "rarete" (
	"id" text PRIMARY KEY NOT NULL,
	"nom" text NOT NULL,
	"rang" integer NOT NULL,
	"s_elevent" boolean NOT NULL,
	CONSTRAINT "rarete_rang_unique" UNIQUE("rang")
);
