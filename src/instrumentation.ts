// Appelé une fois au démarrage du serveur : on refuse de démarrer sans les variables
// d'environnement obligatoires, et une prévisualisation branchée sur la base de
// production refuse de démarrer plutôt que d'y écrire.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertEnv } = await import("./env");
    assertEnv();
    if (process.env.VERCEL_ENV === "preview") {
      const { getPool } = await import("./db");
      const { assertNotProductionDatabase } = await import("./db/production");
      await assertNotProductionDatabase(getPool(), "Démarrage de la prévisualisation refusé");
    }
  }
}
