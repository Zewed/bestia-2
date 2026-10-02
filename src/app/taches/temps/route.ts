import { connection } from "next/server";
import { rattraperLesAbsents } from "@/temps/absents";

// Appelée par la tâche planifiée de Vercel (vercel.json), toutes les 5 minutes.
export const maxDuration = 60;

export async function GET() {
  await connection();
  const passage = await rattraperLesAbsents();
  return Response.json(passage, { headers: { "Cache-Control": "no-store" } });
}
