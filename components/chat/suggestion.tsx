"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback } from "react";
import type { UISuggestion } from "@/lib/editor/suggestions";
import { Button } from "../ui/button";

export const SuggestionDialog = ({
  suggestion,
  onApply,
  onClose,
}: {
  suggestion: UISuggestion;
  onApply: () => void;
  onClose: () => void;
}) => {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <AnimatePresence>
      <div className="sticky inset-0 z-100 h-full w-full">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
          onClick={onClose}
          onKeyDown={handleKeyDown}
          role="presentation"
        />
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          className="absolute left-1/2 top-1/2 z-50 flex w-[min(20rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col gap-6 rounded-3xl border bg-background p-6 font-sans text-sm shadow-xl"
          exit={{ opacity: 0, scale: 0.95 }}
          initial={{ opacity: 0, scale: 0.95 }}
          key={suggestion.id}
          transition={{ duration: 0.15 }}
        >
          <div className="flex flex-col gap-1.5">
            <h2 className="text-lg font-medium">Suggestion</h2>
            <p className="text-muted-foreground text-pretty">
              {suggestion.description}
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button onClick={onClose} variant="outline">
              Dismiss
            </Button>
            <Button onClick={onApply}>Apply</Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
