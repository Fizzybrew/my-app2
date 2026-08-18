"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  type ChangeEvent,
  type Dispatch,
  memo,
  type SetStateAction,
  useCallback,
  useRef,
  useState,
} from "react";
import {
  ModelSelector,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import { toast } from "@/components/ui/toast";
import type { ModelCapabilities } from "@/lib/ai/providers";
import type { Attachment, ChatMessage } from "@/lib/types";
import {
  PromptInput,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "../ai-elements/prompt-input";
import { ModelSelectorDropdown } from "./model-selector-dropdown";
import { PreviewAttachment } from "./preview-attachment";
import {
  type SlashCommand,
  SlashCommandMenu,
  slashCommands,
} from "./slash-commands";
import { Paperclip } from "lucide-react";

type MultimodalInputProps = {
  chatId: string;
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  status: UseChatHelpers<ChatMessage>["status"];
  stop: () => void;
  attachments: Attachment[];
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  selectedModelId: string;
  currentModelName: string;
  currentModelCapabilities: ModelCapabilities;
  onModelChange?: (model: {
    id: string;
    name: string;
    capabilities: ModelCapabilities;
  }) => void;
  onSubmit: () => void;
};

function PureMultimodalInput({
  chatId,
  input,
  setInput,
  status,
  stop,
  attachments,
  setAttachments,
  setMessages,
  selectedModelId,
  currentModelName,
  currentModelCapabilities,
  onModelChange,
  onSubmit,
}: MultimodalInputProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<string[]>([]);
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");

  const handleInput = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      const value = event.target.value;
      setInput(value);

      if (value.startsWith("/") && !value.includes(" ")) {
        setSlashOpen(true);
        setSlashQuery(value.slice(1));
      } else {
        setSlashOpen(false);
      }
    },
    [setInput],
  );

  const handleSlashSelect = useCallback(
    (command: SlashCommand) => {
      setSlashOpen(false);
      setInput("");

      switch (command.action) {
        case "new":
          router.push("/");
          break;
        case "clear":
          setMessages([]);
          break;
        default:
          break;
      }
    },
    [chatId, router, setInput, setMessages],
  );

  const uploadFile = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/files/upload`,
        { body: formData, method: "POST" },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        toast.add({
          title: data?.error ?? "Failed to upload file",
          type: "error",
        });
        return undefined;
      }

      const { url, pathname, contentType } = await response.json();
      return { contentType, name: pathname, url } as Attachment;
    } catch {
      toast.add({
        title: "Failed to upload file, please try again!",
        type: "error",
      });
      return undefined;
    }
  }, []);

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      setUploadQueue(files.map((file) => file.name));

      try {
        const uploaded = await Promise.all(files.map(uploadFile));
        setAttachments((current) => [
          ...current,
          ...uploaded.filter((item): item is Attachment => Boolean(item)),
        ]);
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments, uploadFile],
  );

  const handleTextareaKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!slashOpen) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setSlashOpen(false);
      }
    },
    [slashOpen],
  );

  const [provider] = selectedModelId.split("/");

  const handlePromptSubmit = useCallback(() => {
    if (input.startsWith("/")) {
      const command = slashCommands.find(
        (item) => item.name === input.slice(1).trim(),
      );

      if (command) {
        handleSlashSelect(command);
      }

      return;
    }

    onSubmit();
  }, [handleSlashSelect, input, onSubmit]);

  return (
    <div className="relative flex w-full flex-col rounded-3xl bg-background">
      <input
        aria-label="Upload files"
        className="pointer-events-none fixed -top-4 -left-4 size-0.5 opacity-0"
        multiple
        onChange={handleFileChange}
        ref={fileInputRef}
        tabIndex={-1}
        type="file"
      />

      {slashOpen && (
        <SlashCommandMenu onSelect={handleSlashSelect} query={slashQuery} />
      )}

      <PromptInput onSubmit={handlePromptSubmit}>
        {(attachments.length > 0 || uploadQueue.length > 0) && (
          <div
            className="flex w-full flex-row gap-2 overflow-x-auto px-3 pt-3 no-scrollbar"
            data-testid="attachments-preview"
          >
            {attachments.map((attachment) => (
              <AttachmentPreviewItem
                attachment={attachment}
                fileInputRef={fileInputRef}
                key={attachment.url}
                setAttachments={setAttachments}
              />
            ))}
            {uploadQueue.map((filename) => (
              <PreviewAttachment
                attachment={{ contentType: "", name: filename, url: "" }}
                isUploading
                key={filename}
              />
            ))}
          </div>
        )}
        <PromptInputBody>
          <PromptInputTextarea
            className="min-h-4 px-4 pt-3.5 pb-1.5 text-base!"
            data-testid="multimodal-input"
            onChange={handleInput}
            onKeyDown={handleTextareaKeyDown}
            value={input}
          />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools>
            <PromptInputButton
              aria-label="Attach files and more"
              data-testid="attachments-button"
              disabled={status !== "ready" || !currentModelCapabilities.vision}
              onClick={(event) => {
                event.preventDefault();
                fileInputRef.current?.click();
              }}
              tooltip="Attach files and more"
            >
              <Paperclip className="-rotate-42" />
            </PromptInputButton>

            <ModelSelector
              onOpenChange={setModelSelectorOpen}
              open={modelSelectorOpen}
            >
              <ModelSelectorTrigger
                render={
                  <PromptInputButton
                    aria-label="Select a model"
                    data-testid="model-selector"
                    variant="ghost"
                  />
                }
              >
                <ModelSelectorLogo provider={provider} />
                <ModelSelectorName>{currentModelName}</ModelSelectorName>
              </ModelSelectorTrigger>

              {modelSelectorOpen && (
                <ModelSelectorDropdown
                  onModelChange={onModelChange}
                  selectedModelId={selectedModelId}
                  setOpen={setModelSelectorOpen}
                />
              )}
            </ModelSelector>
          </PromptInputTools>

          <PromptInputSubmit
            aria-label="Send a message"
            className="size-9"
            data-testid="send-button"
            disabled={
              status !== "submitted" &&
              status !== "streaming" &&
              (!input.trim() || uploadQueue.length > 0)
            }
            onStop={stop}
            status={status}
          />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}

export const MultimodalInput = memo(PureMultimodalInput);

function AttachmentPreviewItem({
  attachment,
  fileInputRef,
  setAttachments,
}: {
  attachment: Attachment;
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
}) {
  const handleRemove = useCallback(() => {
    setAttachments((current) =>
      current.filter((item) => item.url !== attachment.url),
    );
    fileInputRef.current && (fileInputRef.current.value = "");
  }, [attachment.url, fileInputRef, setAttachments]);

  return <PreviewAttachment attachment={attachment} onRemove={handleRemove} />;
}
