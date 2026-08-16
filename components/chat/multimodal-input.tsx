"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { AnimatePresence } from "motion/react";
import type { UIMessage } from "ai";
import equal from "fast-deep-equal";
import { ArrowUpIcon, Paperclip, Square } from "lucide-react";
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
import { toast } from "@/components/ui/toast";
import useSWR from "swr";
import { useLocalStorage, useWindowSize } from "usehooks-ts";
import {
  type ModelCapabilities,
  chatModels,
  DEFAULT_CHAT_MODEL,
} from "@/lib/ai/models";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { PreviewAttachment } from "./preview-attachment";
import {
  type SlashCommand,
  SlashCommandMenu,
  slashCommands,
} from "./slash-commands";
import dynamic from "next/dynamic";
import {
  ModelSelector,
  ModelSelectorTrigger,
  ModelSelectorLogo,
  ModelSelectorName,
} from "@/components/ai-elements/model-selector";
import { Spinner } from "../ui/spinner";
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
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-2">
        <Spinner className="size-4 text-muted-foreground" />
      </div>
    ),
  },
);

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
  onModelChange,
  isLoading,
}: {
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
  onModelChange?: (modelId: string) => void;
  isLoading?: boolean;
}) {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();
  const hasAutoFocused = useRef(false);
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);

  useEffect(() => {
    if (!hasAutoFocused.current && width) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
        hasAutoFocused.current = true;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [width]);

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    "input",
    "",
  );

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      const finalValue = domValue || localStorageInput || "";
      setInput(finalValue);
    }
  }, [localStorageInput, setInput]);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<string[]>([]);
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashIndex, setSlashIndex] = useState(0);

  const handleInput = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      const val = event.target.value;
      setInput(val);

      if (val.startsWith("/") && !val.includes(" ")) {
        setSlashOpen(true);
        setSlashQuery(val.slice(1));
        setSlashIndex(0);
      } else {
        setSlashOpen(false);
      }
    },
    [setInput],
  );

  const handleSlashSelect = useCallback(
    (cmd: SlashCommand) => {
      setSlashOpen(false);
      setInput("");
      switch (cmd.action) {
        case "new":
          router.push("/");
          break;
        case "clear":
          setMessages(() => []);
          break;
        case "rename":
          toast.add({
            type: "info",
            description: "Rename is available from the sidebar chat menu.",
          });
          break;
        case "model": {
          const modelBtn = document.querySelector<HTMLButtonElement>(
            "[data-testid='model-selector']",
          );
          modelBtn?.click();
          break;
        }
        case "theme":
          setTheme(resolvedTheme === "dark" ? "light" : "dark");
          break;
        case "delete":
          const id = toast.add({
            title: "Delete this chat?",
            actionProps: {
              children: "Delete",
              onClick() {
                fetch(
                  `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/chat?id=${chatId}`,
                  { method: "DELETE" },
                );
                router.push("/");
                toast.add({ title: "Chat deleted" });
                toast.close(id);
              },
            },
          });

          break;
        case "purge":
          toast.add({
            title: "Delete all chats?",
            actionProps: {
              children: "Delete all",
              onClick() {
                fetch(
                  `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/history`,
                  {
                    method: "DELETE",
                  },
                );
                router.push("/");
                toast.add({ title: "All chats deleted" });
                toast.close(id);
              },
            },
          });
          break;
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
        {
          text: input,
          type: "text",
        },
      ],
      role: "user",
    });

    setAttachments([]);
    setLocalStorageInput("");
    setInput("");

    if (width && width > 768) textareaRef.current?.focus();
  }, [
    input,
    setInput,
    attachments,
    sendMessage,
    setAttachments,
    setLocalStorageInput,
    width,
    chatId,
  ]);

  const uploadFile = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/files/upload`,
        {
          body: formData,
          method: "POST",
        },
      );

      if (response.ok) {
        const data = await response.json();
        const { url, pathname, contentType } = data;

        return {
          contentType,
          name: pathname,
          url,
        };
      }
      const { error } = await response.json();
      toast.add({ type: "error", title: error });
    } catch {
      toast.add({
        type: "error",
        title: "Failed to upload file, please try again!",
      });
    }
  }, []);

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) => attachment !== undefined,
        );

        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch {
        toast.add({ type: "error", title: "Failed to upload files" });
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

      setUploadQueue((prev) => [...prev, "Pasted image"]);

      try {
        const uploadPromises = imageItems
          .map((item) => item.getAsFile())
          .filter((file): file is File => file !== null)
          .map((file) => uploadFile(file));

        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) =>
            attachment !== undefined &&
            attachment.url !== undefined &&
            attachment.contentType !== undefined,
        );

        setAttachments((curr) => [
          ...curr,
          ...(successfullyUploadedAttachments as Attachment[]),
        ]);
      } catch {
        toast.add({ type: "error", title: "Failed to upload pasted image(s)" });
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

  const handleSlashClose = useCallback(() => {
    setSlashOpen(false);
  }, []);

  const handlePromptSubmit = useCallback(() => {
    if (input.startsWith("/")) {
      const query = input.slice(1).trim();
      const cmd = slashCommands.find((c) => c.name === query);
      if (cmd) handleSlashSelect(cmd);
      return;
    }
    if (!input.trim() && attachments.length === 0) return;
    if (status === "ready" || status === "error") {
      submitForm();
    } else {
      toast.add({
        type: "error",
        title: "Please wait for the model to finish its response!",
      });
    }
  }, [attachments.length, handleSlashSelect, input, status, submitForm]);

  const handleTextareaKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (slashOpen) {
        const filtered = slashCommands.filter((cmd) =>
          cmd.name.startsWith(slashQuery.toLowerCase()),
        );
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSlashIndex((i) => Math.min(i + 1, filtered.length - 1));
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSlashIndex((i) => Math.max(i - 1, 0));
          return;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          if (filtered[slashIndex]) handleSlashSelect(filtered[slashIndex]);
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setSlashOpen(false);
          return;
        }
      }
    },
    [handleSlashSelect, slashIndex, slashOpen, slashQuery],
  );

  const currentModel =
    chatModels.find((m) => m.id === selectedModelId) ??
    chatModels.find((m) => m.id === DEFAULT_CHAT_MODEL) ??
    chatModels[0];
  const [provider] = currentModel.id.split("/");

  return (
    <div
      className={cn(
        "relative flex w-full flex-col bg-background rounded-3xl",
        className,
      )}
    >
      <input
        className="pointer-events-none fixed -top-4 -left-4 size-0.5 opacity-0"
        multiple
        onChange={handleFileChange}
        ref={fileInputRef}
        tabIndex={-1}
        type="file"
        aria-label="Upload files"
      />

      <div className="relative">
        {slashOpen ? (
          <SlashCommandMenu
            onClose={handleSlashClose}
            onSelect={handleSlashSelect}
            query={slashQuery}
            selectedIndex={slashIndex}
          />
        ) : null}
      </div>
      <PromptInput onSubmit={handlePromptSubmit} suppressHydrationWarning>
        {(attachments.length > 0 || uploadQueue.length > 0) && (
          <div
            className="flex w-full self-start flex-row gap-2 overflow-x-auto px-3 pt-3 no-scrollbar"
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
                attachment={{
                  contentType: "",
                  name: filename,
                  url: "",
                }}
                isUploading={true}
                key={filename}
              />
            ))}
          </div>
        )}
        <PromptInputTextarea
          className="min-h-4 text-base! px-4 pt-3.5 pb-1.5"
          data-testid="multimodal-input"
          onChange={handleInput}
          onKeyDown={handleTextareaKeyDown}
          placeholder="Ask anything..."
          ref={textareaRef}
          value={input}
          suppressHydrationWarning
        />
        <PromptInputFooter>
          <PromptInputTools>
            <AttachmentsButton
              fileInputRef={fileInputRef}
              selectedModelId={selectedModelId}
              status={status}
            />
            <ModelSelector
              open={modelSelectorOpen}
              onOpenChange={setModelSelectorOpen}
            >
              <ModelSelectorTrigger
                render={
                  <Button
                    data-testid="model-selector"
                    aria-label="Select a model"
                    variant="ghost"
                    className="group"
                  />
                }
              >
                {provider ? <ModelSelectorLogo provider={provider} /> : null}
                <ModelSelectorName>{currentModel.name}</ModelSelectorName>
              </ModelSelectorTrigger>

              {modelSelectorOpen && (
                <ModelSelectorDropdown
                  selectedModelId={selectedModelId}
                  onModelChange={onModelChange}
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
            <>
              {!input.trim() || uploadQueue.length > 0 ? (
                <PromptInputSubmit
                  className="size-9"
                  data-testid="send-button"
                  aria-label="Send a message"
                  disabled
                  status={status}
                >
                  <ArrowUpIcon className="size-4" />
                </PromptInputSubmit>
              ) : (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <PromptInputSubmit
                        className="size-9"
                        data-testid="send-button"
                        status={status}
                      />
                    }
                  >
                    <ArrowUpIcon className="size-4" />
                  </TooltipTrigger>
                  <TooltipContent side="top">Send a message</TooltipContent>
                </Tooltip>
              )}
            </>
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

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) return false;
    if (prevProps.status !== nextProps.status) return false;
    if (!equal(prevProps.attachments, nextProps.attachments)) return false;
    if (prevProps.selectedModelId !== nextProps.selectedModelId) return false;
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.messages.length !== nextProps.messages.length) return false;
    return true;
  },
);

function PureAttachmentPreviewItem({
  attachment,
  fileInputRef,
  setAttachments,
}: {
  attachment: Attachment;
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
}) {
  const handleRemove = useCallback(() => {
    setAttachments((currentAttachments) =>
      currentAttachments.filter((a) => a.url !== attachment.url),
    );
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [attachment.url, fileInputRef, setAttachments]);

  return <PreviewAttachment attachment={attachment} onRemove={handleRemove} />;
}

const AttachmentPreviewItem = memo(PureAttachmentPreviewItem);

function PureAttachmentsButton({
  fileInputRef,
  status,
  selectedModelId,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  status: UseChatHelpers<ChatMessage>["status"];
  selectedModelId: string;
}) {
  const { data: modelsResponse } = useSWR(
    `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/models`,
    (url: string) => fetch(url).then((r) => r.json()),
    { dedupingInterval: 3_600_000, revalidateOnFocus: false },
  );

  const caps: Record<string, ModelCapabilities> | undefined =
    modelsResponse?.capabilities ?? modelsResponse;
  const hasVision = caps?.[selectedModelId]?.vision ?? false;
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      fileInputRef.current?.click();
    },
    [fileInputRef],
  );

  const isAttachDisabled = status !== "ready" || !hasVision;

  if (isAttachDisabled) {
    return (
      <span className="inline-block">
        <Button
          data-testid="attachments-button"
          disabled
          onClick={handleClick}
          variant="ghost"
          size="icon"
          aria-label="Attach files and more"
        >
          <Paperclip className="-rotate-42" />
        </Button>
      </span>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-block" />}>
        <Button
          data-testid="attachments-button"
          onClick={handleClick}
          variant="ghost"
          size="icon"
          aria-label="Attach files and more"
        >
          <Paperclip className="-rotate-42" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">Attach files and more</TooltipContent>
    </Tooltip>
  );
}

const AttachmentsButton = memo(PureAttachmentsButton);

function PureStopButton({
  stop,
  setMessages,
}: {
  stop: () => void;
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
}) {
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      stop();
      setMessages((messages) => messages);
    },
    [setMessages, stop],
  );

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            data-testid="stop-button"
            aria-label="Stop generating"
            onClick={handleClick}
            size="icon"
          />
        }
      >
        <Square fill="currentColor" />
      </TooltipTrigger>
      <TooltipContent side="left">Stop generating</TooltipContent>
    </Tooltip>
  );
}

const StopButton = memo(PureStopButton);
