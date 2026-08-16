export const DEFAULT_CHAT_MODEL = "deepseek/deepseek-v4-flash";

/**
 * Model used for short, non-interactive generations such as chat titles.
 */
export const TITLE_MODEL_ID = DEFAULT_CHAT_MODEL;

/**
 * Temporary client compatibility types. Runtime model data is sourced from
 * RouterAI through /api/models and lib/ai/providers.ts.
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

const DEFAULT_MODEL: ChatModel = {
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
};

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") {
    return undefined;
  }

  const encodedName = `${name}=`;
  const value = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(encodedName))
    ?.slice(encodedName.length);

  return value ? decodeURIComponent(value) : undefined;
}

/**
 * Compatibility facade for older client consumers. New code should use
 * the dynamic catalog from lib/ai/providers.ts through /api/models.
 */
export const chatModels: ChatModel[] = new Proxy([DEFAULT_MODEL], {
  get(target, property, receiver) {
    if (property === "find") {
      return (
        predicate: (model: ChatModel, index: number, array: ChatModel[]) => unknown,
      ) => {
        const found = target.find(predicate);
        if (found) {
          return found;
        }

        const selectedId = getCookie("chat-model");
        if (!selectedId || selectedId === DEFAULT_MODEL.id) {
          return undefined;
        }

        const selectedName = getCookie("chat-model-name") ?? selectedId;
        const selectedProvider = selectedId.includes("/")
          ? selectedId.split("/")[0]
          : "routerai";

        const selectedModel: ChatModel = {
          id: selectedId,
          name: selectedName,
          provider: selectedProvider,
          description: "",
          contextLength: 0,
          capabilities: {
            tools: true,
            vision: false,
            reasoning: false,
          },
        };

        return predicate(selectedModel, 0, [selectedModel])
          ? selectedModel
          : undefined;
      };
    }

    return Reflect.get(target, property, receiver);
  },
});
