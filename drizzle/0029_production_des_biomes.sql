CREATE TABLE "production_biome" (
	"biome_id" text NOT NULL,
	"ressource_id" text NOT NULL,
	"par_heure" numeric(24, 6) NOT NULL,
	CONSTRAINT "production_biome_biome_id_ressource_id_pk" PRIMARY KEY("biome_id","ressource_id"),
	CONSTRAINT "production_jamais_negative" CHECK ("production_biome"."par_heure" >= 0)
);
--> statement-breakpoint
ALTER TABLE "production_biome" ADD CONSTRAINT "production_biome_biome_id_biome_id_fk" FOREIGN KEY ("biome_id") REFERENCES "public"."biome"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_biome" ADD CONSTRAINT "production_biome_ressource_id_ressource_id_fk" FOREIGN KEY ("ressource_id") REFERENCES "public"."ressource"("id") ON DELETE no action ON UPDATE no action;