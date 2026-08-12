export const DEFAULT_CHAT_MODEL = "deepseek/deepseek-v4-flash";

export const titleModel = {
  id: "deepseek/deepseek-v4-flash",
  name: "DeepSeek V4 Flash",
  provider: "deepseek",
  description: "Latest DeepSeek model with fast inference, tool use and vision",
};

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
};

export const chatModels: ChatModel[] = [
  {
    id: "deepseek/deepseek-v4-flash",
    name: "DeepSeek V4 Flash",
    provider: "deepseek",
    description:
      "Latest DeepSeek model with fast inference, tool use and vision",
  },
];

export const modelCapabilities: Record<string, ModelCapabilities> = {
  "deepseek/deepseek-v4-flash": {
    tools: true,
    vision: true,
    reasoning: true,
  },
};

export function getModelCapabilities(modelId: string): ModelCapabilities {
  return (
    modelCapabilities[modelId] || {
      tools: true,
      vision: false,
      reasoning: false,
    }
  );
}

export function getActiveModels(): ChatModel[] {
  return chatModels;
}

export const allowedModelIds = new Set(chatModels.map((m) => m.id));

export const modelsByProvider = chatModels.reduce(
  (acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  },
  {} as Record<string, ChatModel[]>,
);
