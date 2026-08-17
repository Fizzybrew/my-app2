"use client";

import { BrainIcon, EyeIcon, WrenchIcon } from "lucide-react";
import { type ReactNode, useCallback } from "react";
import useSWR from "swr";
import {
  ModelSelectorContent,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorName,
} from "@/components/ai-elements/model-selector";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import type { ChatModel, ModelCapabilities } from "@/lib/ai/providers";

function setCookie(name: string, value: string) {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}`;
}

function ModelSelectorOption({
  capabilities,
  model,
  onModelChange,
  setOpen,
}: {
  capabilities: Record<string, ModelCapabilities> | undefined;
  model: ChatModel;
  onModelChange?: (model: {
    id: string;
    name: string;
    capabilities: ModelCapabilities;
  }) => void;
  setOpen: (open: boolean) => void;
}) {
  const maybeWithTooltip = (icon: ReactNode, label: string) => (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>
        {icon}
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );

  const handleSelect = useCallback(() => {
    const modelCapabilities = capabilities?.[model.id] ?? {
      tools: false,
      vision: false,
      reasoning: false,
    };

    onModelChange?.({
      id: model.id,
      name: model.name,
      capabilities: modelCapabilities,
    });
    setCookie("chat-model", model.id);
    setCookie("chat-model-name", model.name);
    setOpen(false);
    setTimeout(() => {
      document
        .querySelector<HTMLTextAreaElement>("[data-testid='multimodal-input']")
        ?.focus();
    }, 50);
  }, [capabilities, model.id, model.name, onModelChange, setOpen]);

  return (
    <ModelSelectorItem
      onSelect={handleSelect}
      value={model.id}
    >
      <ModelSelectorName>{model.name}</ModelSelectorName>
      <div className="flex items-center gap-2 text-muted-foreground">
        {capabilities?.[model.id]?.tools &&
          maybeWithTooltip(<WrenchIcon />, "Supports tool use")}
        {capabilities?.[model.id]?.vision &&
          maybeWithTooltip(<EyeIcon />, "Supports vision")}
        {capabilities?.[model.id]?.reasoning &&
          maybeWithTooltip(<BrainIcon />, "Supports reasoning")}
      </div>
    </ModelSelectorItem>
  );
}

function ModelSelectorSkeleton() {
  return (
    <div className="space-y-2 p-1.5">
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton className="h-8 w-full rounded-2xl" key={index} />
      ))}
    </div>
  );
}

export function ModelSelectorDropdown({
  selectedModelId,
  onModelChange,
  setOpen,
}: {
  selectedModelId: string;
  onModelChange?: (model: {
    id: string;
    name: string;
    capabilities: ModelCapabilities;
  }) => void;
  setOpen: (open: boolean) => void;
}) {
  const { data: modelsData, error } = useSWR<{
    models: ChatModel[];
    capabilities: Record<string, ModelCapabilities>;
  }>(
    `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/models`,
    (url: string) => fetch(url).then((response) => response.json()),
    { dedupingInterval: 3_600_000, revalidateOnFocus: false },
  );

  const models = modelsData?.models ?? [];
  const capabilities = modelsData?.capabilities;
  const selectedModel =
    models.find((model) => model.id === selectedModelId) ??
    models.find((model) => model.id === DEFAULT_CHAT_MODEL) ??
    models[0];

  const grouped = models.reduce<Record<string, ChatModel[]>>((acc, model) => {
    const key = model.provider || "unknown";
    (acc[key] ??= []).push(model);
    return acc;
  }, {});

  const providerNames: Record<string, string> = {
    alibaba: "Alibaba",
    anthropic: "Anthropic",
    "arcee-ai": "Arcee AI",
    bytedance: "ByteDance",
    cohere: "Cohere",
    deepseek: "DeepSeek",
    google: "Google",
    inception: "Inception",
    kwaipilot: "Kwaipilot",
    meituan: "Meituan",
    meta: "Meta",
    minimax: "MiniMax",
    mistral: "Mistral",
    moonshotai: "Moonshot",
    morph: "Morph",
    nvidia: "Nvidia",
    openai: "OpenAI",
    perplexity: "Perplexity",
    "prime-intellect": "Prime Intellect",
    xai: "xAI",
    xiaomi: "Xiaomi",
    zai: "Zai",
  };

  return (
    <ModelSelectorContent title={selectedModel?.id ?? selectedModelId}>
      <ModelSelectorInput placeholder="Search models..." />
      <ModelSelectorList>
        {!modelsData && !error ? (
          <ModelSelectorSkeleton />
        ) : error ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            Unable to load models. Try again.
          </div>
        ) : (
          Object.keys(grouped)
            .sort((a, b) => a.localeCompare(b))
            .map((provider) => (
              <ModelSelectorGroup
                heading={providerNames[provider] ?? provider}
                key={provider}
              >
                {grouped[provider].map((model) => (
                  <ModelSelectorOption
                    capabilities={capabilities}
                    key={model.id}
                    model={model}
                    onModelChange={onModelChange}
                    setOpen={setOpen}
                  />
                ))}
              </ModelSelectorGroup>
            ))
        )}
      </ModelSelectorList>
    </ModelSelectorContent>
  );
}
