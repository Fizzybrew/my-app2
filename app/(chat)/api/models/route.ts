import { getModelCatalog } from "@/lib/ai/providers";

export async function GET() {
  const models = await getModelCatalog();

  return Response.json(
    {
      models,
      capabilities: Object.fromEntries(
        models.map((model) => [model.id, model.capabilities]),
      ),
    },
    {
      headers: {
        // The provider catalog is already cached server-side. Keep this
        // response private so clients do not cache a potentially stale list.
        "Cache-Control": "private, no-store",
      },
    },
  );
}
