CREATE TABLE "biome" (
	"id" text PRIMARY KEY NOT NULL,
	"nom" text NOT NULL,
	"ordre" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "variante_biome" (
	"id" text PRIMARY KEY NOT NULL,
	"biome_id" text NOT NULL,
	"nom" text NOT NULL,
	"ordre" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "variante_biome" ADD CONSTRAINT "variante_biome_biome_id_biome_id_fk" FOREIGN KEY ("biome_id") REFERENCES "public"."biome"("id") ON DELETE no action ON UPDATE no action;