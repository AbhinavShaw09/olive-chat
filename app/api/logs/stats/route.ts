import { getLogStats } from "@/lib/inference-logger";

export async function GET() {
  const stats = await getLogStats();
  return Response.json(stats);
}
