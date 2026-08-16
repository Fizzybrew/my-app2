"use client";

import { BrainIcon, EyeIcon, LockIcon, WrenchIcon } from "lucide-react";
import { type ReactNode, useCallback } from "react";
import useSWR from "swr";
import {
  ModelSelectorContent,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorName,
} from "@/components/ai-elements/model-selector";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import type { ChatModel, ModelCapabilities } from "@/lib/ai/providers";
import { cn } from "@/lib/utils";

function setCookie(name: string, value: string) {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}`;
}

function ModelSelectorOption({
  capabilities,
  model,
  onModelChange,
  selectedModelId,
  setOpen,
}: {
  capabilities: Record<string, ModelCapabilities> | undefined;
  model: ChatModel;
  onModelChange?: (modelId: string) => void;
  selectedModelId: string;
  setOpen: (open: boolean) => void;
}) {
  const [logoProvider] = model.id.split("/");
  const maybeWithTooltip = (icon: ReactNode, label: string) => (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>
        {icon}
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );

  const handleSelect = useCallback(() => {
    onModelChange?.(model.id);
    setCookie("chat-model", model.id);
    setOpen(false);
    setTimeout(() => {
      document
        .querySelector<HTMLTextAreaElement>("[data-testid='multimodal-input']")
        ?.focus();
    }, 50);
  }, [model.id, onModelChange, setOpen]);

  return (
    <ModelSelectorItem
      className={cn(
        "flex w-full transition-colors",
        "data-[selected=true]:bg-muted data-[selected=true]:text-foreground",
      )}
      onSelect={handleSelect}
      value={model.id}
    >
      <ModelSelectorLogo provider={logoProvider} />
      <ModelSelectorName>{model.name}</ModelSelectorName>
      <div className="ml-auto flex items-center gap-2 text-muted-foreground">
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

export function ModelSelectorDropdown({
  selectedModelId,
  onModelChange,
  setOpen,
}: {
  selectedModelId: string;
  onModelChange?: (modelId: string) => void;
  setOpen: (open: boolean) => void;
}) {
  const { data: modelsData } = useSWR<{
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

  if (!selectedModel) {
    return null;
  }

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
    <ModelSelectorContent title={selectedModel.id}>
      <ModelSelectorInput placeholder="Search models..." />
      <ModelSelectorList>
        {Object.keys(grouped)
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
                  selectedModelId={selectedModelId}
                  setOpen={setOpen}
                />
              ))}
            </ModelSelectorGroup>
          ))}
      </ModelSelectorList>
    </ModelSelectorContent>
  );
}
