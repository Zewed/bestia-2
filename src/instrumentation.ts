// Appelé une fois au démarrage du serveur :
// - on refuse de démarrer sans les variables d'environnement obligatoires ;
// - une prévisualisation branchée sur la base de production refuse de démarrer ;
// - hors production, l'horloge du jeu charge sa vitesse et son ancre (temps accéléré).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertEnv } = await import("./env");
    assertEnv();
    if (process.env.VERCEL_ENV === "preview") {
      const { getPool } = await import("./db");
      const { assertNotProductionDatabase } = await import("./db/production");
      await assertNotProductionDatabase(getPool(), "Démarrage de la prévisualisation refusé");
    }
    const { avertissementProduction } = await import("./temps/horloge");
    const avertissement = avertissementProduction();
    if (avertissement) console.warn(avertissement);
    if (process.env.VERCEL_ENV !== "production") {
      const { getPool } = await import("./db");
      const { vitesseDemandee } = await import("./temps/horloge");
      const { synchroniserHorloge } = await import("./temps/synchroniser-horloge");
      const ancre = await synchroniserHorloge(getPool(), vitesseDemandee());
      if (ancre.facteur !== 1) console.info(`Horloge du jeu : temps ×${ancre.facteur}.`);
    }
  }
}
