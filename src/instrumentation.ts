// Appelé une fois au démarrage du serveur : on refuse de démarrer
// sans les variables d'environnement obligatoires.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertEnv } = await import("./env");
    assertEnv();
  }
}
