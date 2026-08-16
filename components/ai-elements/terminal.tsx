"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Ansi from "ansi-to-react";
import { Check, Copy, TerminalIcon, Trash, X } from "lucide-react";
import type { ComponentProps, HTMLAttributes } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TerminalContextType {
  output: string;
  isStreaming: boolean;
  autoScroll: boolean;
  onClear?: () => void;
  onClose?: () => void;
}

const TerminalContext = createContext<TerminalContextType>({
  autoScroll: true,
  isStreaming: false,
  output: "",
  onClose: undefined,
});

export type TerminalHeaderProps = HTMLAttributes<HTMLDivElement>;

export const TerminalHeader = ({
  className,
  children,
  ...props
}: TerminalHeaderProps) => (
  <div
    className={cn(
      "flex items-center justify-between px-4 py-2  bg-sidebar",
      className,
    )}
    {...props}
  >
    {children}
  </div>
);

export type TerminalTitleProps = HTMLAttributes<HTMLDivElement>;

export const TerminalTitle = ({
  className,
  children,
  ...props
}: TerminalTitleProps) => (
  <div
    className={cn(
      "flex items-center gap-2 text-sm text-muted-foreground",
      className,
    )}
    {...props}
  >
    <TerminalIcon className="size-4" />
    {children ?? "Terminal"}
  </div>
);

export type TerminalStatusProps = HTMLAttributes<HTMLDivElement>;

export const TerminalStatus = ({
  className,
  children,
  ...props
}: TerminalStatusProps) => {
  const { isStreaming } = useContext(TerminalContext);

  if (!isStreaming) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-xs text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export type TerminalActionsProps = HTMLAttributes<HTMLDivElement>;

export const TerminalActions = ({
  className,
  children,
  ...props
}: TerminalActionsProps) => (
  <div className={cn("flex items-center gap-1", className)} {...props}>
    {children}
  </div>
);

export type TerminalCopyButtonProps = ComponentProps<typeof Button> & {
  onCopy?: () => void;
  onError?: (error: Error) => void;
  timeout?: number;
};

export const TerminalCopyButton = ({
  onCopy,
  onError,
  timeout = 2000,
  children,
  className,
  ...props
}: TerminalCopyButtonProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const timeoutRef = useRef<number>(0);
  const { output } = useContext(TerminalContext);

  const copyToClipboard = useCallback(async () => {
    if (typeof window === "undefined" || !navigator?.clipboard?.writeText) {
      onError?.(new Error("Clipboard API not available"));
      return;
    }

    try {
      await navigator.clipboard.writeText(output);
      setIsCopied(true);
      onCopy?.();
      timeoutRef.current = window.setTimeout(() => setIsCopied(false), timeout);
    } catch (error) {
      onError?.(error as Error);
    }
  }, [output, onCopy, onError, timeout]);

  useEffect(
    () => () => {
      window.clearTimeout(timeoutRef.current);
    },
    [],
  );

  const Icon = isCopied ? Check : Copy;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            onClick={copyToClipboard}
            size="icon-sm"
            variant="ghost"
            aria-label="Copy terminal output"
            {...props}
          />
        }
      >
        {children ?? <Icon size={14} />}
      </TooltipTrigger>
      <TooltipContent side="bottom">Copy</TooltipContent>
    </Tooltip>
  );
};

export type TerminalClearButtonProps = ComponentProps<typeof Button>;

export const TerminalClearButton = ({
  children,
  className,
  ...props
}: TerminalClearButtonProps) => {
  const { onClear, output } = useContext(TerminalContext);

  if (!onClear) {
    return null;
  }

  const isDisabled = output.trim().length === 0;

  return (
    <>
      {isDisabled ? (
        <Button
          onClick={onClear}
          size="icon-sm"
          variant="ghost"
          disabled={isDisabled}
          aria-label="Clear terminal output"
          {...props}
        >
          {children ?? <Trash size={14} />}
        </Button>
      ) : (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                onClick={onClear}
                size="icon-sm"
                variant="ghost"
                disabled={isDisabled}
                aria-label="Clear terminal output"
                {...props}
              />
            }
          >
            {children ?? <Trash size={14} />}
          </TooltipTrigger>
          <TooltipContent side="bottom">Clear</TooltipContent>
        </Tooltip>
      )}
    </>
  );
};

export type TerminalCloseButtonProps = ComponentProps<typeof Button>;

export const TerminalCloseButton = ({
  children,
  className,
  ...props
}: TerminalCloseButtonProps) => {
  const { onClose } = useContext(TerminalContext);

  if (!onClose) return null;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            onClick={onClose}
            size="icon-sm"
            variant="ghost"
            aria-label="Close terminal"
            {...props}
          />
        }
      >
        {children ?? <X size={14} />}
      </TooltipTrigger>
      <TooltipContent side="bottom">Close</TooltipContent>
    </Tooltip>
  );
};

export type TerminalContentProps = HTMLAttributes<HTMLDivElement>;

export const TerminalContent = ({
  className,
  children,
  ...props
}: TerminalContentProps) => {
  const { output, isStreaming, autoScroll } = useContext(TerminalContext);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && containerRef.current)
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [output, autoScroll]);

  return (
    <div
      className={cn(
        "h-full overflow-auto p-4 font-mono text-sm leading-relaxed bg-sidebar",
        className,
      )}
      ref={containerRef}
      {...props}
    >
      {children ?? (
        <pre className="whitespace-pre-wrap wrap-break-word">
          <Ansi>{output}</Ansi>
          {isStreaming && (
            <span className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-foreground" />
          )}
        </pre>
      )}
    </div>
  );
};

export type TerminalProps = HTMLAttributes<HTMLDivElement> & {
  output: string;
  isStreaming?: boolean;
  autoScroll?: boolean;
  onClear?: () => void;
  onClose?: () => void;
};

export const Terminal = ({
  output,
  isStreaming = false,
  autoScroll = true,
  onClear,
  onClose,
  className,
  children,
  ...props
}: TerminalProps) => {
  const contextValue = useMemo(
    () => ({ autoScroll, isStreaming, onClear, onClose, output }),
    [autoScroll, isStreaming, onClear, onClose, output],
  );

  return (
    <TerminalContext.Provider value={contextValue}>
      <div
        className={cn("flex flex-col overflow-hidden", className)}
        {...props}
      >
        {children ?? (
          <>
            <TerminalHeader>
              <TerminalTitle />
              <div className="flex items-center gap-1">
                <TerminalStatus />
                <TerminalActions>
                  <TerminalCopyButton />
                  {onClear && <TerminalClearButton />}
                  {onClose && <TerminalCloseButton />}
                </TerminalActions>
              </div>
            </TerminalHeader>
            <TerminalContent />
          </>
        )}
      </div>
    </TerminalContext.Provider>
  );
};
