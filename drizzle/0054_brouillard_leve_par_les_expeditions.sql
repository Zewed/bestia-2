-- US-0914 : l'Expédition qui a sorti chaque Case du brouillard de son Territoire, la première à l'avoir fait ; null pour
-- les abords du Foyer et les Cases découvertes avant. Le Récit du retour (US-0917) compte ainsi les Cases levées par chaque
-- Expédition (casesLeveesParLExpedition, src/expeditions/brouillard.ts). Purement additive : une colonne, sa référence (une
-- Expédition effacée laisse ses Cases découvertes) et l'index qui les retrouve.
ALTER TABLE "case_decouverte" ADD COLUMN "expedition_id" integer;--> statement-breakpoint
ALTER TABLE "case_decouverte" ADD CONSTRAINT "case_decouverte_expedition_id_expedition_id_fk" FOREIGN KEY ("expedition_id") REFERENCES "public"."expedition"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "case_decouverte_par_expedition" ON "case_decouverte" USING btree ("expedition_id") WHERE "case_decouverte"."expedition_id" is not null;