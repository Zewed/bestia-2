CREATE TABLE "couple_de_depart" (
	"espece_id" text PRIMARY KEY NOT NULL,
	"ordre" integer NOT NULL,
	"style" text NOT NULL,
	"phrase" text NOT NULL,
	CONSTRAINT "couple_de_depart_ordre_unique" UNIQUE("ordre")
);
--> statement-breakpoint
ALTER TABLE "couple_de_depart" ADD CONSTRAINT "couple_de_depart_espece_id_espece_id_fk" FOREIGN KEY ("espece_id") REFERENCES "public"."espece"("id") ON DELETE no action ON UPDATE no action;