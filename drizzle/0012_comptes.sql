CREATE TABLE "compte" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "compte_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"email" text NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "compte_email_unique" UNIQUE("email"),
	CONSTRAINT "compte_email_normalise" CHECK ("compte"."email" = lower("compte"."email") and "compte"."email" !~ '[[:space:]]')
);
