"use client";

import { motion } from "motion/react";
import { memo, useCallback } from "react";
import { suggestions } from "@/lib/constants";
import { Suggestion } from "../ai-elements/suggestion";

type SuggestedActionsProps = {
  chatId: string;
  onSuggestionClick?: (suggestion: string) => void;
};

function PureSuggestedActions({
  chatId,
  onSuggestionClick,
}: SuggestedActionsProps) {
  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      onSuggestionClick?.(suggestion);
    },
    [chatId, onSuggestionClick]
  );

  return (
    <div
      className="flex w-full gap-2 overflow-x-auto sm:grid sm:grid-cols-2 sm:overflow-visible mt-4"
      data-testid="suggested-actions"
      style={{
        msOverflowStyle: "none",
        scrollbarWidth: "none",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {suggestions.map(({ text, icon }, index) => (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="min-w-50 shrink-0 sm:min-w-0 sm:shrink"
          exit={{ opacity: 0, y: 16 }}
          initial={{ opacity: 0, y: 16 }}
          key={text}
          transition={{
            delay: 0.06 * index,
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <Suggestion
            className="w-full"
            onClick={handleSuggestionClick}
            suggestion={text}
          >
            {icon}
            <span>{text}</span>
          </Suggestion>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) {
      return false;
    }
    return true;
  }
);
