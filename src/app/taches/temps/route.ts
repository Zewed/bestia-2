import { connection } from "next/server";
import { passageDeLaTache } from "@/temps/absents";
import { autoriserTache } from "@/temps/autorisation";

// Appelée par la tâche planifiée de Vercel (vercel.json), toutes les heures tant que le jeu n'est pas ouvert (src/reglages.ts).
export const maxDuration = 60;

export async function GET(request: Request) {
  await connection();
  const verdict = autoriserTache(request.headers.get("authorization"), process.env.CRON_SECRET);
  if (!verdict.autorise) {
    console.warn(`Tâche planifiée : appel refusé (${verdict.raison}).`);
    return Response.json({ statut: "refusé" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  const { ok, passage } = await passageDeLaTache();
  return Response.json(passage, { status: ok ? 200 : 500, headers: { "Cache-Control": "no-store" } });
}
