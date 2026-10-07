CREATE TABLE "recit" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "recit_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"territoire_id" integer NOT NULL,
	"titre" text NOT NULL,
	"texte" text NOT NULL,
	"survenu_le" timestamp with time zone NOT NULL,
	"lu_le" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "recit" ADD CONSTRAINT "recit_territoire_id_territoire_id_fk" FOREIGN KEY ("territoire_id") REFERENCES "public"."territoire"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "recit_par_territoire" ON "recit" USING btree ("territoire_id","survenu_le");