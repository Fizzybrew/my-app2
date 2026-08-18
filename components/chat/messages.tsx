import type { UseChatHelpers } from "@ai-sdk/react";
import { Spinner } from "@/components/ui/spinner";
import type { Vote } from "@/lib/db/schema";
import type { ChatMessage } from "@/lib/types";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "../ai-elements/conversation";
import { useDataStream } from "./data-stream-provider";
import { PreviewMessage, ThinkingMessage } from "./message";

type MessagesProps = {
  addToolApprovalResponse: UseChatHelpers<ChatMessage>["addToolApprovalResponse"];
  chatId: string;
  status: UseChatHelpers<ChatMessage>["status"];
  votes: Vote[] | undefined;
  messages: ChatMessage[];
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
  isReadonly: boolean;
  isArtifactVisible: boolean;
  isLoading?: boolean;
  selectedModelId: string;
};

function PureMessages({
  addToolApprovalResponse,
  chatId,
  status,
  votes,
  messages,
  setMessages,
  regenerate,
  isReadonly,
  isArtifactVisible: _isArtifactVisible,
  isLoading = false,
  selectedModelId: _selectedModelId,
}: MessagesProps) {
  useDataStream();

  const isLoadingHistory = isLoading && messages.length === 0;
  const isGenerating = status === "submitted" || status === "streaming";

  return (
    <Conversation>
      <ConversationContent className="mx-auto w-full max-w-3xl pb-[141.66px]">
        {isLoadingHistory ? (
          <ConversationEmptyState icon={<Spinner />} />
        ) : messages.length === 0 ? (
          <ConversationEmptyState title="What can I help with?" />
        ) : (
          <>
            {messages.map((message, index) => (
              <PreviewMessage
                addToolApprovalResponse={addToolApprovalResponse}
                chatId={chatId}
                isLoading={
                  status === "streaming" && messages.length - 1 === index
                }
                isReadonly={isReadonly}
                key={message.id}
                message={message}
                regenerate={regenerate}
                setMessages={setMessages}
                vote={
                  votes
                    ? votes.find((vote) => vote.messageId === message.id)
                    : undefined
                }
              />
            ))}

            {isGenerating && messages.at(-1)?.role !== "assistant" && (
              <ThinkingMessage />
            )}
          </>
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}

export const Messages = PureMessages;
