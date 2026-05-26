import { runPipeline } from "@/lib/ingestion/pipeline";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  if (!body) {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = await runPipeline(body);

  if (result.errors.length > 0) {
    return Response.json(
      { error: "Validation failed", details: result.errors },
      { status: 400 },
    );
  }

  return Response.json({
    ingested: result.ingested,
    skipped: result.skipped,
  });
}
