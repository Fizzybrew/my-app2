"use client";

import useSWR from "swr";
import { cn } from "@/lib/utils";
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
import {
  type ChatModel,
  chatModels,
  DEFAULT_CHAT_MODEL,
  type ModelCapabilities,
} from "@/lib/ai/models";
import { BrainIcon, EyeIcon, LockIcon, WrenchIcon } from "lucide-react";
import { useCallback, type ReactNode } from "react";

function setCookie(name: string, value: string) {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}`;
}

function ModelSelectorOption({
  capabilities,
  curated,
  model,
  onModelChange,
  selectedModelId,
  setOpen,
}: {
  capabilities: Record<string, ModelCapabilities> | undefined;
  curated: boolean;
  model: ChatModel;
  onModelChange?: (modelId: string) => void;
  selectedModelId: string;
  setOpen: (open: boolean) => void;
}) {
  const [logoProvider] = model.id.split("/");
  const maybeWithTooltip = (icon: ReactNode, label: string) => {
    if (!curated) return icon;
    return (
      <Tooltip>
        <TooltipTrigger render={<span className="inline-flex" />}>
          {icon}
        </TooltipTrigger>
        <TooltipContent side="top">{label}</TooltipContent>
      </Tooltip>
    );
  };

  const handleSelect = useCallback(() => {
    if (!curated) return;
    onModelChange?.(model.id);
    setCookie("chat-model", model.id);
    setOpen(false);
    setTimeout(() => {
      document
        .querySelector<HTMLTextAreaElement>("[data-testid='multimodal-input']")
        ?.focus();
    }, 50);
  }, [curated, model.id, onModelChange, setOpen]);

  const option = (
    <ModelSelectorItem
      aria-disabled={!curated}
      className={cn(
        "flex w-full transition-colors",
        curated
          ? "data-[selected=true]:bg-muted data-[selected=true]:text-foreground"
          : "cursor-not-allowed opacity-40 data-[selected=true]:bg-transparent data-[selected=true]:opacity-60 data-[selected=true]:ring-1 data-[selected=true]:ring-muted-foreground/30 data-[selected=true]:ring-inset",
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
        {!curated && <LockIcon />}
      </div>
    </ModelSelectorItem>
  );

  if (curated) return option;
  return (
    <Tooltip>
      <TooltipTrigger render={<div className="w-full cursor-not-allowed" />}>
        {option}
      </TooltipTrigger>
      <TooltipContent side="right">
        This model is not available in the demo.
      </TooltipContent>
    </Tooltip>
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
  const { data: modelsData } = useSWR(
    `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/models`,
    (url: string) => fetch(url).then((r) => r.json()),
    { dedupingInterval: 3_600_000, revalidateOnFocus: false },
  );

  const capabilities: Record<string, ModelCapabilities> | undefined =
    modelsData?.capabilities ?? modelsData;
  const dynamicModels: ChatModel[] | undefined = modelsData?.models;
  const activeModels = dynamicModels ?? chatModels;

  const selectedModel =
    activeModels.find((m) => m.id === selectedModelId) ??
    activeModels.find((m) => m.id === DEFAULT_CHAT_MODEL) ??
    activeModels[0];

  return (
    <ModelSelectorContent title={selectedModel.id}>
      <ModelSelectorInput placeholder="Search models..." />
      <ModelSelectorList>
        {(() => {
          const curatedIds = new Set(chatModels.map((m) => m.id));
          const allModels = dynamicModels
            ? [
                ...chatModels,
                ...dynamicModels.filter((m) => !curatedIds.has(m.id)),
              ]
            : chatModels;

          const grouped: Record<
            string,
            { model: ChatModel; curated: boolean }[]
          > = {};
          for (const model of allModels) {
            const key = curatedIds.has(model.id)
              ? "_available"
              : model.provider;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push({ curated: curatedIds.has(model.id), model });
          }

          const sortedKeys = Object.keys(grouped).sort((a, b) => {
            if (a === "_available") return -1;
            if (b === "_available") return 1;
            return a.localeCompare(b);
          });

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

          return sortedKeys.map((key) => (
            <ModelSelectorGroup
              heading={
                key === "_available" ? "Available" : (providerNames[key] ?? key)
              }
              key={key}
            >
              {grouped[key].map(({ model, curated }) => (
                <ModelSelectorOption
                  capabilities={capabilities}
                  curated={curated}
                  key={model.id}
                  model={model}
                  onModelChange={onModelChange}
                  selectedModelId={selectedModelId}
                  setOpen={setOpen}
                />
              ))}
            </ModelSelectorGroup>
          ));
        })()}
      </ModelSelectorList>
    </ModelSelectorContent>
  );
}
