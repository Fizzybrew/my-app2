import { getActiveModels, modelCapabilities } from "@/lib/ai/models";

export async function GET() {
  const headers = {
    "Cache-Control": "no-cache, no-store, must-revalidate",
  };

  const models = getActiveModels();
  const capabilities = models.reduce(
    (acc, model) => {
      acc[model.id] = modelCapabilities[model.id] || {
        reasoning: false,
        tools: true,
        vision: false,
      };
      return acc;
    },
    {} as Record<string, any>,
  );

  return Response.json({ capabilities, models }, { headers });
}
