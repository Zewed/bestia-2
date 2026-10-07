-- US-0401 : la graine dont un Monde est généré. Le Monde déjà né reçoit la sienne à la prochaine préparation
-- de sa Couronne (npm run monde:couronne, à chaque mise en ligne) : celle dont sa Couronne a toujours été
-- tirée, graineDuMonde(nom) ; rien d'autre ne change.
ALTER TABLE "monde" ADD COLUMN "graine" bigint;--> statement-breakpoint
ALTER TABLE "monde" ADD CONSTRAINT "monde_graine_sur_32_bits" CHECK ("monde"."graine" between 0 and 4294967295);
