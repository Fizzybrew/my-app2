import { getActiveModels, modelCapabilities } from "@/lib/ai/models";

export async function GET() {
  const headers = {
    "Cache-Control": "no-cache, no-store, must-revalidate",
  };

  const models = getActiveModels();
  const capabilities = models.reduce(
    (acc, model) => {
      acc[model.id] = modelCapabilities[model.id] || {
        tools: true,
        vision: false,
        reasoning: false,
      };
      return acc;
    },
    {} as Record<string, any>,
  );

  return Response.json({ models, capabilities }, { headers });
}
