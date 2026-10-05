CREATE TABLE "case_du_monde" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "case_du_monde_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"monde_id" integer NOT NULL,
	"q" integer NOT NULL,
	"r" integer NOT NULL,
	"anneau" integer NOT NULL,
	"couronne" boolean NOT NULL,
	"biome_id" text NOT NULL,
	"variante_id" text,
	CONSTRAINT "case_unique_dans_le_monde" UNIQUE("monde_id","q","r"),
	CONSTRAINT "case_anneau_exact" CHECK ("case_du_monde"."anneau" = greatest(abs("case_du_monde"."q"), abs("case_du_monde"."r"), abs("case_du_monde"."q" + "case_du_monde"."r")))
);
--> statement-breakpoint
ALTER TABLE "monde" ADD COLUMN "rayon" integer;--> statement-breakpoint
ALTER TABLE "monde" ADD COLUMN "anneaux_couronne" integer;--> statement-breakpoint
ALTER TABLE "case_du_monde" ADD CONSTRAINT "case_du_monde_monde_id_monde_id_fk" FOREIGN KEY ("monde_id") REFERENCES "public"."monde"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_du_monde" ADD CONSTRAINT "case_du_monde_biome_id_biome_id_fk" FOREIGN KEY ("biome_id") REFERENCES "public"."biome"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_du_monde" ADD CONSTRAINT "case_du_monde_variante_id_variante_biome_id_fk" FOREIGN KEY ("variante_id") REFERENCES "public"."variante_biome"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "case_par_anneau" ON "case_du_monde" USING btree ("monde_id","anneau");