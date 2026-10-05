ALTER TABLE "case_du_monde" ADD COLUMN "chef_id" integer;--> statement-breakpoint
ALTER TABLE "case_du_monde" ADD CONSTRAINT "case_du_monde_chef_id_chef_id_fk" FOREIGN KEY ("chef_id") REFERENCES "public"."chef"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "case_par_chef" ON "case_du_monde" USING btree ("chef_id");