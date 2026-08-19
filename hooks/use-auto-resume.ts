"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { useEffect } from "react";
import { useDataStream } from "@/components/chat/data-stream-provider";
import type { ChatMessage } from "@/lib/types";

export type UseAutoResumeParams = {
  autoResume: boolean;
  initialMessages: ChatMessage[];
  resumeStream: UseChatHelpers<ChatMessage>["resumeStream"];
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
};

export function useAutoResume({
  autoResume,
  initialMessages,
  resumeStream,
  setMessages,
}: UseAutoResumeParams) {
  const { dataStream } = useDataStream();

  useEffect(() => {
    if (!autoResume) {
      return;
    }

    const mostRecentMessage = initialMessages.at(-1);

    if (mostRecentMessage?.role === "user") {
      resumeStream();
    }
  }, [autoResume, initialMessages, resumeStream]);

  useEffect(() => {
    const appendMessagePart = dataStream?.find(
      (part) => part.type === "data-appendMessage",
    );

    if (!appendMessagePart) {
      return;
    }

    try {
      const message = JSON.parse(appendMessagePart.data) as ChatMessage;

      setMessages((currentMessages) => {
        if (currentMessages.some((current) => current.id === message.id)) {
          return currentMessages;
        }

        return [...currentMessages, message];
      });
    } catch {
      // Ignore malformed transient data parts.
    }
  }, [dataStream, setMessages]);
}
