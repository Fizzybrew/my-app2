"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { useRouter } from "next/navigation";
import { type ChangeEvent, memo, useCallback, useState } from "react";
import {
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "@/components/ai-elements/attachments";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionAddScreenshot,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputFooter,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import type { ModelCapabilities } from "@/lib/ai/providers";
import type { ChatMessage } from "@/lib/types";
import { ModelSelectorDropdown } from "./model-selector-dropdown";
import { type SlashCommand, SlashCommandMenu, slashCommands } from "./slash-commands";

type MultimodalInputProps = {
  status: UseChatHelpers<ChatMessage>["status"];
  stop: () => void;
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  selectedModelId: string;
  currentModelName: string;
  currentModelCapabilities: ModelCapabilities;
  onModelChange?: (model: {
    id: string;
    name: string;
    capabilities: ModelCapabilities;
  }) => void;
  onSubmit: (message: PromptInputMessage) => void | Promise<void>;
};

function PromptInputAttachments() {
  const attachments = usePromptInputAttachments();

  if (attachments.files.length === 0) return null;

  return (
    <Attachments variant="inline">
      {attachments.files.map((file) => (
        <Attachment data={file} key={file.id} onRemove={() => attachments.remove(file.id)}>
          <AttachmentPreview />
          <AttachmentRemove />
        </Attachment>
      ))}
    </Attachments>
  );
}

function PureMultimodalInput({
  status,
  stop,
  setMessages,
  selectedModelId,
  currentModelName,
  currentModelCapabilities,
  onModelChange,
  onSubmit,
}: MultimodalInputProps) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");

  const handleInput = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.currentTarget.value;
    setInput(value);
    if (value.startsWith("/") && !value.includes(" ")) {
      setSlashOpen(true);
      setSlashQuery(value.slice(1));
    } else {
      setSlashOpen(false);
    }
  }, []);

  const handleSlashSelect = useCallback((command: SlashCommand) => {
    setSlashOpen(false);
    setInput("");
    if (command.action === "new") router.push("/");
    if (command.action === "clear") setMessages([]);
  }, [router, setMessages]);

  const handlePromptSubmit = useCallback(async (message: PromptInputMessage) => {
    const text = message.text.trim();
    const hasAttachments = message.files.length > 0;

    if (text.startsWith("/")) {
      const command = slashCommands.find((item) => item.name === text.slice(1).trim());
      if (command) handleSlashSelect(command);
      return;
    }

    if (!text && !hasAttachments) return;

    await onSubmit(message);
    setInput("");
  }, [handleSlashSelect, onSubmit]);

  return (
    <div className="relative flex w-full flex-col rounded-3xl bg-background">
      {slashOpen && <SlashCommandMenu onSelect={handleSlashSelect} query={slashQuery} />}

      <PromptInput globalDrop multiple onSubmit={handlePromptSubmit}>
        <PromptInputHeader>
          <PromptInputAttachments />
        </PromptInputHeader>

        <PromptInputBody>
          <PromptInputTextarea
            className="min-h-4 px-4 pt-3.5 pb-1.5 text-base!"
            data-testid="multimodal-input"
            onChange={handleInput}
            placeholder="Ask anything..."
            value={input}
          />
        </PromptInputBody>

        <PromptInputFooter>
          <PromptInputTools>
            <PromptInputActionMenu>
              <PromptInputActionMenuTrigger
                className="size-9"
                disabled={status !== "ready" || !currentModelCapabilities.vision}
                tooltip="Add files and more"
              />
              <PromptInputActionMenuContent>
                <PromptInputActionAddAttachments />
                <PromptInputActionAddScreenshot />
              </PromptInputActionMenuContent>
            </PromptInputActionMenu>
            <ModelSelectorDropdown
              currentModelName={currentModelName}
              onModelChange={onModelChange}
              selectedModelId={selectedModelId}
            />
          </PromptInputTools>
          <PromptInputSubmit
            aria-label="Send a message"
            className="size-9"
            data-testid="send-button"
            onStop={stop}
            status={status}
          />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}

export const MultimodalInput = memo(PureMultimodalInput);
