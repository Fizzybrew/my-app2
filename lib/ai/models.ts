export const DEFAULT_CHAT_MODEL = "deepseek/deepseek-v4-flash";

export const titleModel = {
  description: "Latest DeepSeek model with fast inference, tool use and vision",
  id: "deepseek/deepseek-v4-flash",
  name: "DeepSeek V4 Flash",
  provider: "deepseek",
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
    description:
      "Latest DeepSeek model with fast inference, tool use and vision",
    id: "deepseek/deepseek-v4-flash",
    name: "DeepSeek V4 Flash",
    provider: "deepseek",
  },
];

export const modelCapabilities: Record<string, ModelCapabilities> = {
  "deepseek/deepseek-v4-flash": {
    reasoning: true,
    tools: true,
    vision: true,
  },
};

export function getModelCapabilities(modelId: string): ModelCapabilities {
  return (
    modelCapabilities[modelId] || {
      reasoning: false,
      tools: true,
      vision: false,
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
  {} as Record<string, ChatModel[]>
);
