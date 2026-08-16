import equal from "fast-deep-equal";
import { Copy, Pencil, RefreshCw, ThumbsDown, ThumbsUp } from "lucide-react";
import { memo, useCallback } from "react";
import { useSWRConfig } from "swr";
import { useCopyToClipboard } from "usehooks-ts";
import { toast } from "@/components/ui/toast";
import type { Vote } from "@/lib/db/schema";
import type { ChatMessage } from "@/lib/types";
import {
  MessageAction as Action,
  MessageActions as Actions,
} from "../ai-elements/message";

export function PureMessageActions({
  chatId,
  message,
  vote,
  isLoading,
  onEdit,
  onRegenerate,
}: {
  chatId: string;
  message: ChatMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  onEdit?: () => void;
  onRegenerate?: () => void;
}) {
  const { mutate } = useSWRConfig();
  const [_, copyToClipboard] = useCopyToClipboard();

  const textFromParts = message.parts
    ?.filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();

  const handleCopy = useCallback(async () => {
    if (!textFromParts) {
      toast.add({ description: "There's no text to copy!", type: "error" });
      return;
    }

    await copyToClipboard(textFromParts);
    toast.add({ description: "Copied to clipboard!", type: "success" });
  }, [copyToClipboard, textFromParts]);

  const handleUpvote = useCallback(() => {
    const upvote = fetch(
      `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/vote`,
      {
        body: JSON.stringify({
          chatId,
          messageId: message.id,
          type: "up",
        }),
        method: "PATCH",
      }
    );

    toast.promise(upvote, {
      error: "Failed to upvote response.",
      loading: "Upvoting Response...",
      success: () => {
        mutate<Vote[]>(
          `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/vote?chatId=${chatId}`,
          (currentVotes) => {
            if (!currentVotes) {
              return [];
            }

            const votesWithoutCurrent = currentVotes.filter(
              (currentVote) => currentVote.messageId !== message.id
            );

            return [
              ...votesWithoutCurrent,
              {
                chatId,
                isUpvoted: true,
                messageId: message.id,
              },
            ];
          },
          { revalidate: false }
        );

        return "Upvoted Response!";
      },
    });
  }, [chatId, message.id, mutate]);

  const handleDownvote = useCallback(() => {
    const downvote = fetch(
      `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/vote`,
      {
        body: JSON.stringify({
          chatId,
          messageId: message.id,
          type: "down",
        }),
        method: "PATCH",
      }
    );

    toast.promise(downvote, {
      error: "Failed to downvote response.",
      loading: "Downvoting Response...",
      success: () => {
        mutate<Vote[]>(
          `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/vote?chatId=${chatId}`,
          (currentVotes) => {
            if (!currentVotes) {
              return [];
            }

            const votesWithoutCurrent = currentVotes.filter(
              (currentVote) => currentVote.messageId !== message.id
            );

            return [
              ...votesWithoutCurrent,
              {
                chatId,
                isUpvoted: false,
                messageId: message.id,
              },
            ];
          },
          { revalidate: false }
        );

        return "Downvoted Response!";
      },
    });
  }, [chatId, message.id, mutate]);

  if (isLoading) {
    return null;
  }

  if (message.role === "user") {
    return (
      <Actions className="justify-end opacity-0 transition-opacity duration-150 pointer-coarse:opacity-100 [@media(hover:hover)]:group-hover/message:opacity-100">
        <div className="flex items-center gap-0.5">
          {onEdit ? (
            <Action
              aria-label="Edit message"
              data-testid="message-edit-button"
              onClick={onEdit}
              tooltip="Edit"
              variant="ghost"
            >
              <Pencil />
            </Action>
          ) : null}
          <Action onClick={handleCopy} tooltip="Copy" variant="ghost">
            <Copy />
          </Action>
        </div>
      </Actions>
    );
  }

  const isUpvoteDisabled = vote?.isUpvoted;
  const isDownvoteDisabled = vote && !vote.isUpvoted;

  return (
    <Actions className="opacity-0 transition-opacity duration-150 pointer-coarse:opacity-100 [@media(hover:hover)]:group-hover/message:opacity-100">
      <Action
        aria-label="Copy message"
        onClick={handleCopy}
        tooltip="Copy"
        variant="ghost"
      >
        <Copy />
      </Action>

      <Action
        aria-label="Upvote response"
        data-testid="message-upvote"
        disabled={isUpvoteDisabled}
        onClick={handleUpvote}
        tooltip={isUpvoteDisabled ? undefined : "Upvote Response"}
        variant="ghost"
      >
        <ThumbsUp />
      </Action>
      <Action
        aria-label="Downvote response"
        data-testid="message-downvote"
        disabled={isDownvoteDisabled}
        onClick={handleDownvote}
        tooltip={isDownvoteDisabled ? undefined : "Downvote Response"}
        variant="ghost"
      >
        <ThumbsDown />
      </Action>
      {onRegenerate && (
        <Action
          aria-label="Regenerate response"
          data-testid="message-regenerate"
          onClick={onRegenerate}
          tooltip="Regenerate Response"
          variant="ghost"
        >
          <RefreshCw />
        </Action>
      )}
    </Actions>
  );
}

export const MessageActions = memo(
  PureMessageActions,
  (prevProps, nextProps) => {
    if (!equal(prevProps.vote, nextProps.vote)) {
      return false;
    }
    if (prevProps.isLoading !== nextProps.isLoading) {
      return false;
    }
    if (prevProps.onRegenerate !== nextProps.onRegenerate) {
      return false;
    }
    return true;
  }
);
