import { createOpenAI } from "@ai-sdk/openai";
import { customProvider, type LanguageModel } from "ai";
import { isTestEnvironment } from "../constants";
import { DEFAULT_CHAT_MODEL, titleModel } from "./models";

const ROUTERAI_API_BASE_URL =
  process.env.ROUTERAI_BASE_URL?.replace(/\/$/, "") ||
  "https://routerai.ru/api/v1";

const MODEL_CATALOG_REVALIDATE_SECONDS = 60 * 60;

const routerai = createOpenAI({
  apiKey: process.env.ROUTERAI_API_KEY,
  baseURL: ROUTERAI_API_BASE_URL,
});

export type ModelCapabilities = {
  tools: boolean;
  vision: boolean;
  reasoning: boolean;
};

export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
  contextLength: number;
  capabilities: ModelCapabilities;
};

type RouterAIModel = {
  id?: unknown;
  name?: unknown;
  description?: unknown;
  context_length?: unknown;
  architecture?: {
    input_modalities?: unknown;
    output_modalities?: unknown;
  } | null;
  supported_parameters?: unknown;
};

type RouterAIModelsResponse = {
  data?: unknown;
};

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

function parseModel(model: RouterAIModel): ChatModel | null {
  if (typeof model.id !== "string" || model.id.length === 0) {
    return null;
  }

  const inputModalities = isStringArray(model.architecture?.input_modalities)
    ? model.architecture.input_modalities
    : [];

  const supportedParameters = isStringArray(model.supported_parameters)
    ? model.supported_parameters
    : [];

  return {
    id: model.id,
    name: typeof model.name === "string" ? model.name : model.id,
    description:
      typeof model.description === "string" ? model.description : "",
    provider: model.id.split("/")[0] ?? "unknown",
    contextLength:
      typeof model.context_length === "number" ? model.context_length : 0,
    capabilities: {
      tools:
        supportedParameters.includes("tools") ||
        supportedParameters.includes("tool_choice"),
      vision:
        inputModalities.includes("image") || inputModalities.includes("video"),
      reasoning:
        supportedParameters.includes("reasoning") ||
        supportedParameters.includes("include_reasoning"),
    },
  };
}

function parseModelsResponse(response: unknown): ChatModel[] {
  if (!response || typeof response !== "object") {
    throw new Error("RouterAI returned an invalid models response");
  }

  const data = (response as RouterAIModelsResponse).data;

  if (!Array.isArray(data)) {
    throw new Error("RouterAI returned an invalid models list");
  }

  return data
    .map((model) =>
      model && typeof model === "object"
        ? parseModel(model as RouterAIModel)
        : null
    )
    .filter((model): model is ChatModel => model !== null)
    .filter((model) => model.capabilities.tools);
}

/** Fetch the current RouterAI model catalog. */
export async function getModelCatalog(): Promise<ChatModel[]> {
  const response = await fetch(`${ROUTERAI_API_BASE_URL}/models`, {
    next: { revalidate: MODEL_CATALOG_REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch RouterAI models: ${response.status} ${response.statusText}`
    );
  }

  return parseModelsResponse(await response.json());
}

export async function getActiveModels(): Promise<ChatModel[]> {
  return getModelCatalog();
}

export async function getModelCapabilities(
  modelId: string
): Promise<ModelCapabilities> {
  const models = await getModelCatalog();
  const model = models.find((candidate) => candidate.id === modelId);

  return (
    model?.capabilities ?? {
      tools: false,
      vision: false,
      reasoning: false,
    }
  );
}

export async function getModel(modelId: string): Promise<ChatModel | null> {
  const models = await getModelCatalog();
  return models.find((model) => model.id === modelId) ?? null;
}

export async function getAllowedModelIds(): Promise<Set<string>> {
  const models = await getModelCatalog();
  return new Set(models.map((model) => model.id));
}

export async function getModelsByProvider(): Promise<
  Record<string, ChatModel[]>
> {
  const models = await getModelCatalog();

  return models.reduce<Record<string, ChatModel[]>>((acc, model) => {
    const provider = acc[model.provider] ?? [];
    provider.push(model);
    acc[model.provider] = provider;
    return acc;
  }, {});
}

export function getLanguageModel(modelId: string): LanguageModel {
  if (isTestEnvironment) {
    const { chatModel } = require("./models.mock");
    return chatModel;
  }

  return routerai.languageModel(modelId);
}

export function getTitleModel(): LanguageModel {
  if (isTestEnvironment) {
    const { titleModel: mockTitleModel } = require("./models.mock");
    return mockTitleModel;
  }

  return routerai.languageModel(titleModel.id || DEFAULT_CHAT_MODEL);
}

export const myProvider = isTestEnvironment
  ? (() => {
      const { chatModel, titleModel: mockTitleModel } = require("./models.mock");

      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "title-model": mockTitleModel,
        },
      });
    })()
  : null;
