CREATE TABLE "chef" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "chef_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"compte_id" integer NOT NULL,
	"monde_id" integer NOT NULL,
	"nom" text NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chef_un_par_monde" UNIQUE("compte_id","monde_id")
);
--> statement-breakpoint
ALTER TABLE "chef" ADD CONSTRAINT "chef_compte_id_compte_id_fk" FOREIGN KEY ("compte_id") REFERENCES "public"."compte"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chef" ADD CONSTRAINT "chef_monde_id_monde_id_fk" FOREIGN KEY ("monde_id") REFERENCES "public"."monde"("id") ON DELETE no action ON UPDATE no action;