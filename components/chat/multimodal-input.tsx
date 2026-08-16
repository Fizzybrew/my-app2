"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { ArrowUpIcon, Paperclip, Square } from "lucide-react";
import { AnimatePresence } from "motion/react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  type ChangeEvent,
  type Dispatch,
  memo,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useLocalStorage, useWindowSize } from "usehooks-ts";
import {
  ModelSelector,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import { toast } from "@/components/ui/toast";
import type { ModelCapabilities } from "@/lib/ai/providers";
import type { Attachment, ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "../ai-elements/prompt-input";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { PreviewAttachment } from "./preview-attachment";
import {
  type SlashCommand,
  SlashCommandMenu,
  slashCommands,
} from "./slash-commands";

const SuggestedActions = dynamic(
  () => import("./suggested-actions").then((mod) => mod.SuggestedActions),
  { ssr: true },
);

const ModelSelectorDropdown = dynamic(
  () =>
    import("./model-selector-dropdown").then(
      (mod) => mod.ModelSelectorDropdown,
    ),
  {
    loading: () => (
      <div className="flex items-center justify-center p-2">
        <Spinner className="size-4 text-muted-foreground" />
      </div>
    ),
    ssr: false,
  },
);

type MultimodalInputProps = {
  chatId: string;
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  status: UseChatHelpers<ChatMessage>["status"];
  stop: () => void;
  attachments: Attachment[];
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
  messages: UIMessage[];
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  className?: string;
  selectedModelId: string;
  currentModelName: string;
  currentModelCapabilities: ModelCapabilities;
  onModelChange?: (model: {
    id: string;
    name: string;
    capabilities: ModelCapabilities;
  }) => void;
  isLoading?: boolean;
};

function PureMultimodalInput({
  chatId,
  input,
  setInput,
  status,
  stop,
  attachments,
  setAttachments,
  messages,
  setMessages,
  sendMessage,
  className,
  selectedModelId,
  currentModelName,
  currentModelCapabilities,
  onModelChange,
  isLoading,
}: MultimodalInputProps) {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasAutoFocused = useRef(false);
  const { width } = useWindowSize();
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<string[]>([]);
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashIndex, setSlashIndex] = useState(0);

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    "input",
    "",
  );

  useEffect(() => {
    if (!hasAutoFocused.current && width) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
        hasAutoFocused.current = true;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [width]);

  useEffect(() => {
    setInput(localStorageInput || "");
  }, [localStorageInput, setInput]);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const handleInput = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      const value = event.target.value;
      setInput(value);

      if (value.startsWith("/") && !value.includes(" ")) {
        setSlashOpen(true);
        setSlashQuery(value.slice(1));
        setSlashIndex(0);
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
        case "rename":
          toast.add({
            description: "Rename is available from the sidebar chat menu.",
            type: "info",
          });
          break;
        case "model":
          document
            .querySelector<HTMLButtonElement>("[data-testid='model-selector']")
            ?.click();
          break;
        case "theme":
          setTheme(resolvedTheme === "dark" ? "light" : "dark");
          break;
        case "delete": {
          const toastId = toast.add({
            actionProps: {
              children: "Delete",
              onClick() {
                void fetch(
                  `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/chat?id=${chatId}`,
                  { method: "DELETE" },
                );
                router.push("/");
                toast.add({ title: "Chat deleted" });
                toast.close(toastId);
              },
            },
            title: "Delete this chat?",
          });
          break;
        }
        case "purge": {
          const toastId = toast.add({
            actionProps: {
              children: "Delete all",
              onClick() {
                void fetch(
                  `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/history`,
                  { method: "DELETE" },
                );
                router.push("/");
                toast.add({ title: "All chats deleted" });
                toast.close(toastId);
              },
            },
            title: "Delete all chats?",
          });
          break;
        }
        default:
          break;
      }
    },
    [chatId, resolvedTheme, router, setInput, setMessages, setTheme],
  );

  const submitForm = useCallback(() => {
    window.history.pushState(
      {},
      "",
      `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/chat/${chatId}`,
    );

    sendMessage({
      parts: [
        ...attachments.map((attachment) => ({
          mediaType: attachment.contentType,
          name: attachment.name,
          type: "file" as const,
          url: attachment.url,
        })),
        { text: input, type: "text" },
      ],
      role: "user",
    });

    setAttachments([]);
    setLocalStorageInput("");
    setInput("");

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    attachments,
    chatId,
    input,
    sendMessage,
    setAttachments,
    setInput,
    setLocalStorageInput,
    width,
  ]);

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

  const handlePaste = useCallback(
    async (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      const imageItems = Array.from(items).filter((item) =>
        item.type.startsWith("image/"),
      );
      if (imageItems.length === 0) return;

      event.preventDefault();
      setUploadQueue((current) => [...current, "Pasted image"]);

      try {
        const uploaded = await Promise.all(
          imageItems
            .map((item) => item.getAsFile())
            .filter((file): file is File => file !== null)
            .map(uploadFile),
        );

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

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.addEventListener("paste", handlePaste);
    return () => textarea.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  const handlePromptSubmit = useCallback(() => {
    if (input.startsWith("/")) {
      const command = slashCommands.find(
        (item) => item.name === input.slice(1).trim(),
      );
      if (command) handleSlashSelect(command);
      return;
    }

    if (!input.trim() && attachments.length === 0) return;

    if (status === "ready" || status === "error") {
      submitForm();
    } else {
      toast.add({
        title: "Please wait for the model to finish its response!",
        type: "error",
      });
    }
  }, [attachments.length, handleSlashSelect, input, status, submitForm]);

  const handleTextareaKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!slashOpen) return;

      const filtered = slashCommands.filter((command) =>
        command.name.startsWith(slashQuery.toLowerCase()),
      );

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSlashIndex((index) => Math.min(index + 1, filtered.length - 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setSlashIndex((index) => Math.max(index - 1, 0));
      } else if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        if (filtered[slashIndex]) handleSlashSelect(filtered[slashIndex]);
      } else if (event.key === "Escape") {
        event.preventDefault();
        setSlashOpen(false);
      }
    },
    [handleSlashSelect, slashIndex, slashOpen, slashQuery],
  );

  const [provider] = selectedModelId.split("/");

  return (
    <div
      className={cn(
        "relative flex w-full flex-col rounded-3xl bg-background",
        className,
      )}
    >
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
        <SlashCommandMenu
          onClose={() => setSlashOpen(false)}
          onSelect={handleSlashSelect}
          query={slashQuery}
          selectedIndex={slashIndex}
        />
      )}

      <PromptInput onSubmit={handlePromptSubmit} suppressHydrationWarning>
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

        <PromptInputTextarea
          className="min-h-4 px-4 pt-3.5 pb-1.5 text-base!"
          data-testid="multimodal-input"
          onChange={handleInput}
          onKeyDown={handleTextareaKeyDown}
          placeholder="Ask anything..."
          ref={textareaRef}
          suppressHydrationWarning
          value={input}
        />

        <PromptInputFooter>
          <PromptInputTools>
            <AttachmentsButton
              capabilities={currentModelCapabilities}
              fileInputRef={fileInputRef}
              status={status}
            />

            <ModelSelector
              onOpenChange={setModelSelectorOpen}
              open={modelSelectorOpen}
            >
              <ModelSelectorTrigger
                render={
                  <Button
                    aria-label="Select a model"
                    className="group"
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

          {status === "submitted" || status === "streaming" ? (
            <Tooltip>
              <TooltipTrigger
                render={<StopButton setMessages={setMessages} stop={stop} />}
              />
              <TooltipContent side="top">Stop replying</TooltipContent>
            </Tooltip>
          ) : (
            <PromptInputSubmit
              aria-label="Send a message"
              className="size-9"
              data-testid="send-button"
              disabled={!input.trim() || uploadQueue.length > 0}
              status={status}
            >
              <ArrowUpIcon className="size-4" />
            </PromptInputSubmit>
          )}
        </PromptInputFooter>
      </PromptInput>

      <AnimatePresence>
        {!isLoading &&
          messages.length === 0 &&
          attachments.length === 0 &&
          uploadQueue.length === 0 &&
          !input.trim() && (
            <div className="absolute inset-x-0 top-full">
              <SuggestedActions
                chatId={chatId}
                onSuggestionClick={(text) => {
                  setInput(text);
                  textareaRef.current?.focus();
                }}
              />
            </div>
          )}
      </AnimatePresence>
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

function AttachmentsButton({
  capabilities,
  fileInputRef,
  status,
}: {
  capabilities: ModelCapabilities;
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  status: UseChatHelpers<ChatMessage>["status"];
}) {
  const disabled = status !== "ready" || !capabilities.vision;

  const button = (
    <Button
      aria-label="Attach files and more"
      data-testid="attachments-button"
      disabled={disabled}
      onClick={(event) => {
        event.preventDefault();
        fileInputRef.current?.click();
      }}
      size="icon"
      variant="ghost"
    >
      <Paperclip className="-rotate-42" />
    </Button>
  );

  if (disabled) return button;

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-block" />}>
        {button}
      </TooltipTrigger>
      <TooltipContent side="top">Attach files and more</TooltipContent>
    </Tooltip>
  );
}

function StopButton({
  stop,
  setMessages,
}: {
  stop: () => void;
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
}) {
  return (
    <Button
      aria-label="Stop generating"
      data-testid="stop-button"
      onClick={(event) => {
        event.preventDefault();
        stop();
        setMessages((messages) => messages);
      }}
      size="icon"
    >
      <Square fill="currentColor" />
    </Button>
  );
}
