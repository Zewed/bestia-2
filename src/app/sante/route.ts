import { connection } from "next/server";
import { getPool } from "@/db";
import { checkHealth } from "@/health";

// Dit si le jeu et sa base répondent, et quelle version est en ligne.
export async function GET() {
  await connection(); // calculé à chaque appel, jamais figé à la construction
  const { httpStatus, body } = await checkHealth(getPool);
  return Response.json(body, { status: httpStatus, headers: { "Cache-Control": "no-store" } });
}
