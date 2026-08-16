"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import type { ToolUIPart } from "ai";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Vote } from "@/lib/db/schema";
import type { ChatMessage } from "@/lib/types";
import { sanitizeText } from "@/lib/utils";
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageToolbar,
} from "../ai-elements/message";
import {
  Confirmation,
  ConfirmationAccepted,
  ConfirmationAction,
  ConfirmationActions,
  ConfirmationRejected,
  ConfirmationRequest,
  ConfirmationTitle,
} from "../ai-elements/confirmation";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "../ai-elements/reasoning";
import { Shimmer } from "../ai-elements/shimmer";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "../ai-elements/tool";
import { useDataStream } from "./data-stream-provider";
import { DocumentToolResult } from "./document";
import { MessageActions } from "./message-actions";
import { PreviewAttachment } from "./preview-attachment";
import { Weather } from "./weather";
import { submitEditedMessage } from "./message-editor";
import { DocumentPreview } from "./document-preview";
import { Button } from "../ui/button";

function WaitingText() {
  const { waitingStatus } = useDataStream();
  const waitingText = waitingStatus?.message ?? "Waiting...";

  return <Shimmer as="span">{waitingText}</Shimmer>;
}

function ToolApprovalConfirmation({
  approval,
  state,
  toolType,
  addToolApprovalResponse,
}: {
  approval: ToolUIPart["approval"];
  state: ToolUIPart["state"];
  toolType: string;
  addToolApprovalResponse: UseChatHelpers<ChatMessage>["addToolApprovalResponse"];
}) {
  if (!approval) return null;

  const toolName = toolType.replace(/^tool-/, "");

  return (
    <Confirmation approval={approval} state={state}>
      <ConfirmationTitle>
        <ConfirmationRequest>
          Allow <strong>{toolName}</strong> to execute this tool?
        </ConfirmationRequest>
        <ConfirmationAccepted>
          <span>Tool execution approved.</span>
        </ConfirmationAccepted>
        <ConfirmationRejected>
          <span>Tool execution rejected.</span>
        </ConfirmationRejected>
      </ConfirmationTitle>
      <ConfirmationActions>
        <ConfirmationAction
          variant="outline"
          onClick={() =>
            addToolApprovalResponse({
              id: approval.id,
              approved: false,
            })
          }
        >
          Deny
        </ConfirmationAction>

        <ConfirmationAction
          onClick={() =>
            addToolApprovalResponse({
              id: approval.id,
              approved: true,
            })
          }
        >
          Allow
        </ConfirmationAction>
      </ConfirmationActions>
    </Confirmation>
  );
}

const PurePreviewMessage = ({
  addToolApprovalResponse,
  chatId,
  message,
  vote,
  isLoading,
  setMessages,
  regenerate,
  isReadonly,
}: {
  addToolApprovalResponse: UseChatHelpers<ChatMessage>["addToolApprovalResponse"];
  chatId: string;
  message: ChatMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
  isReadonly: boolean;
}) => {
  const attachmentsFromMessage = message.parts.filter(
    (part) => part.type === "file",
  );

  useDataStream();

  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  const hasAnyContent = message.parts.some(
    (part) =>
      (part.type === "text" && part.text?.trim().length > 0) ||
      (part.type === "reasoning" &&
        "text" in part &&
        part.text?.trim().length > 0) ||
      part.type.startsWith("tool-"),
  );

  const isThinking = isAssistant && isLoading && !hasAnyContent;

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  const userText =
    message.parts
      ?.filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("") ?? "";

  const handleStartEdit = useCallback(() => {
    setEditText(userText);
    setIsEditing(true);
  }, [userText]);

  const handleSaveEdit = useCallback(async () => {
    setIsEditing(false);

    if (editText.trim() === "" || editText === userText) return;

    await submitEditedMessage({
      message,
      regenerate,
      setMessages,
      text: editText,
    });
  }, [editText, message, regenerate, setMessages, userText]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
  }, []);

  useEffect(() => {
    if (!isEditing || !editTextareaRef.current) return;

    const textarea = editTextareaRef.current;

    const timer = setTimeout(() => {
      textarea.focus();

      const len = textarea.value.length;

      textarea.setSelectionRange(len, len);
    }, 0);

    return () => clearTimeout(timer);
  }, [isEditing]);

  const attachments = attachmentsFromMessage.length > 0 && (
    <div
      className="flex flex-row justify-end gap-2"
      data-testid="message-attachments"
    >
      {attachmentsFromMessage.map((attachment) => (
        <PreviewAttachment
          attachment={{
            contentType: attachment.mediaType,
            name: attachment.filename ?? "file",
            url: attachment.url,
          }}
          key={attachment.url}
        />
      ))}
    </div>
  );

  const reasoningParts = message.parts.filter(
    (part) => part.type === "reasoning",
  );

  const reasoningText = reasoningParts.map((part) => part.text).join("\n\n");

  const hasReasoning = reasoningParts.length > 0;

  const lastPart = message.parts.at(-1);

  const isReasoningStreaming =
    isAssistant && isLoading && lastPart?.type === "reasoning";

  const hasVisibleContent = message.parts.some(
    (part) =>
      part.type === "text" ||
      part.type === "reasoning" ||
      part.type.startsWith("tool-") ||
      part.type === "file",
  );

  if (isAssistant && !hasVisibleContent && !isLoading) return null;

  const parts = message.parts.map((part, index) => {
    const { type } = part;

    const key = `message-${message.id}-part-${index}`;

    if (type === "reasoning") return null;

    if (type.startsWith("tool-")) {
      const approval =
        "approval" in part
          ? (part.approval as ToolUIPart["approval"])
          : undefined;

      const toolState =
        "state" in part ? (part.state as ToolUIPart["state"]) : undefined;

      const hasApprovalState =
        approval &&
        toolState &&
        (toolState === "approval-requested" ||
          toolState === "approval-responded" ||
          toolState === "output-denied");

      const approvalUI =
        approval && toolState ? (
          <ToolApprovalConfirmation
            approval={approval}
            state={toolState}
            toolType={type}
            addToolApprovalResponse={addToolApprovalResponse}
          />
        ) : null;

      if (hasApprovalState) {
        return (
          <div className="w-full" key={key}>
            {approvalUI}
          </div>
        );
      }

      if (type === "tool-getWeather") {
        const { toolCallId, state } = part;

        const approvalOutcome =
          approval && toolState === "output-available" ? (
            <ToolApprovalConfirmation
              approval={approval}
              state={toolState}
              toolType={type}
              addToolApprovalResponse={addToolApprovalResponse}
            />
          ) : null;

        if (state === "output-available") {
          return (
            <div className="w-full space-y-3" key={toolCallId}>
              {approvalOutcome}
              <Weather weatherAtLocation={part.output} />
            </div>
          );
        }

        return null;
      }

      if (type === "tool-createDocument") {
        const { toolCallId } = part;

        if (part.output && "error" in part.output) {
          return (
            <div
              className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-500 dark:bg-red-950/50"
              key={toolCallId}
            >
              Error creating document: {String(part.output.error)}
            </div>
          );
        }

        return (
          <div className="w-full space-y-3" key={toolCallId}>
            {approval && toolState === "output-available" && (
              <ToolApprovalConfirmation
                approval={approval}
                state={toolState}
                toolType={type}
                addToolApprovalResponse={addToolApprovalResponse}
              />
            )}

            <DocumentPreview isReadonly={isReadonly} result={part.output} />
          </div>
        );
      }

      if (type === "tool-updateDocument") {
        const { toolCallId } = part;

        if (part.output && "error" in part.output) {
          return (
            <div
              className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-500 dark:bg-red-950/50"
              key={toolCallId}
            >
              Error updating document: {String(part.output.error)}
            </div>
          );
        }

        return (
          <div className="relative w-full space-y-3" key={toolCallId}>
            {approval && toolState === "output-available" && (
              <ToolApprovalConfirmation
                approval={approval}
                state={toolState}
                toolType={type}
                addToolApprovalResponse={addToolApprovalResponse}
              />
            )}

            <DocumentPreview
              args={{ ...part.output, isUpdate: true }}
              isReadonly={isReadonly}
              result={part.output}
            />
          </div>
        );
      }

      if (type === "tool-requestSuggestions") {
        const { toolCallId, state } = part;

        return (
          <div className="w-full space-y-3" key={toolCallId}>
            {approval && toolState === "output-available" && (
              <ToolApprovalConfirmation
                approval={approval}
                state={toolState}
                toolType={type}
                addToolApprovalResponse={addToolApprovalResponse}
              />
            )}

            <Tool defaultOpen={false}>
              <ToolHeader state={state} type="tool-requestSuggestions" />

              <ToolContent>
                {state === "input-available" && (
                  <ToolInput input={part.input} />
                )}

                {state === "output-available" && (
                  <ToolOutput
                    errorText={undefined}
                    output={
                      "error" in part.output ? (
                        <div className="rounded border p-2 text-red-500">
                          Error: {String(part.output.error)}
                        </div>
                      ) : (
                        <DocumentToolResult
                          isReadonly={isReadonly}
                          result={part.output}
                          type="request-suggestions"
                        />
                      )
                    }
                  />
                )}
              </ToolContent>
            </Tool>
          </div>
        );
      }

      return null;
    }

    if (type === "text") {
      return (
        <MessageResponse key={key}>{sanitizeText(part.text)}</MessageResponse>
      );
    }

    return null;
  });

  const handleEdit = isUser ? handleStartEdit : undefined;

  const handleRegenerate = isAssistant
    ? () => regenerate({ messageId: message.id })
    : undefined;

  return (
    <Message
      id={message.id}
      from={message.role}
      data-role={message.role}
      data-testid={`message-${message.role}`}
      className="group/message"
    >
      {isThinking ? (
        <WaitingText />
      ) : isEditing ? (
        <div className="w-full">
          <div className="flex w-full flex-col gap-1.5 rounded-3xl border border-border/30 bg-secondary px-3.5 py-2">
            <textarea
              ref={editTextareaRef}
              value={editText}
              onChange={(event) => setEditText(event.target.value)}
              className="min-h-20 w-full resize-none bg-transparent placeholder:text-muted-foreground focus:outline-none"
              placeholder="Edit your message..."
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button onClick={handleCancelEdit} variant="outline">
                Cancel
              </Button>

              <Button onClick={handleSaveEdit}>Send</Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {attachments}

          <MessageContent data-testid="message-content">
            {hasReasoning && (
              <Reasoning isStreaming={isReasoningStreaming}>
                <ReasoningTrigger />
                <ReasoningContent>{reasoningText}</ReasoningContent>
              </Reasoning>
            )}

            {parts}
          </MessageContent>

          {!isReadonly && (
            <MessageToolbar
              className={isUser ? "justify-end" : "justify-start"}
            >
              <MessageActions
                chatId={chatId}
                isLoading={isLoading}
                message={message}
                onEdit={handleEdit}
                onRegenerate={handleRegenerate}
                vote={vote}
              />
            </MessageToolbar>
          )}
        </>
      )}
    </Message>
  );
};

export const PreviewMessage = PurePreviewMessage;

export const ThinkingMessage = () => (
  <Message from="assistant" data-testid="message-assistant-loading">
    <WaitingText />
  </Message>
);
