export const DEFAULT_CHAT_MODEL = "deepseek/deepseek-v4-flash";

/**
 * Model used for short, non-interactive generations such as chat titles.
 */
export const TITLE_MODEL_ID = DEFAULT_CHAT_MODEL;

/**
 * Compatibility types for client components during the model-catalog migration.
 * Runtime model data is loaded from /api/models via lib/ai/providers.ts.
 */
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

export const chatModels: ChatModel[] = [
  {
    id: DEFAULT_CHAT_MODEL,
    name: "DeepSeek V4 Flash",
    provider: "deepseek",
    description: "Default chat model",
    contextLength: 0,
    capabilities: {
      tools: true,
      vision: true,
      reasoning: true,
    },
  },
];
