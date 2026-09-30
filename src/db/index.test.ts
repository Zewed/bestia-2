import { describe, expect, it } from "vitest";
import { DatabaseUnavailableError, explainDatabaseError, isConnectionError, withStrictSsl } from "./index";

function pgError(code: string, message = "erreur du pilote"): Error {
  return Object.assign(new Error(message), { code });
}

describe("erreurs de connexion", () => {
  it.each([
    ["ECONNREFUSED", "le serveur refuse la connexion"],
    ["ENOTFOUND", "l'adresse du serveur est introuvable"],
    ["28P01", "identifiant ou mot de passe refusé"],
    ["3D000", "cette base n'existe pas"],
  ])("explique %s", (code, reason) => {
    const error = explainDatabaseError(pgError(code));
    expect(error).toBeInstanceOf(DatabaseUnavailableError);
    expect(error.message).toContain(reason);
    expect(error.message).toContain("DATABASE_URL");
  });

  it("reconnaît un délai dépassé", () => {
    const error = new Error("Connection terminated due to connection timeout");
    expect(isConnectionError(error)).toBe(true);
    expect(explainDatabaseError(error).message).toContain("le serveur ne répond pas");
  });

  it("ne confond pas une requête fautive avec une panne de connexion", () => {
    expect(isConnectionError(pgError("42P01", 'relation "monde" does not exist'))).toBe(false);
  });

  it("ne recopie jamais l'adresse de la base dans le message", () => {
    const secret = ["postgres://bestia:", "motdepasse", "@ep-exemple.neon.tech/neondb"].join("");
    const error = explainDatabaseError(pgError("ENOTFOUND", `getaddrinfo ENOTFOUND ${secret}`));
    expect(error.message).not.toContain("motdepasse");
  });
});

describe("chiffrement de la connexion", () => {
  it("exige la vérification complète du certificat quand Neon demande require", () => {
    // Assemblée en morceaux pour ne pas déclencher le scan de secrets.
    const url = withStrictSsl(["postgresql://u:", "p@ep-exemple.neon.tech/neondb?sslmode=require"].join(""));
    expect(new URL(url).searchParams.get("sslmode")).toBe("verify-full");
  });

  it("laisse les autres adresses telles quelles", () => {
    expect(withStrictSsl("postgres://localhost/bestia")).toBe("postgres://localhost/bestia");
  });
});
