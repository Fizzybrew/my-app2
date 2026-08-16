import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import {
  Terminal,
  TerminalActions,
  TerminalClearButton,
  TerminalCloseButton,
  TerminalContent,
  TerminalCopyButton,
  TerminalHeader,
  TerminalStatus,
  TerminalTitle,
} from "@/components/ai-elements/terminal";
import { useArtifactSelector } from "@/hooks/use-artifact";

export type ConsoleOutputContent = {
  type: "text" | "image";
  value: string;
};

export type ConsoleOutput = {
  id: string;
  status: "in_progress" | "loading_packages" | "completed" | "failed";
  contents: ConsoleOutputContent[];
};

type ConsoleProps = {
  consoleOutputs: ConsoleOutput[];
  setConsoleOutputs: Dispatch<SetStateAction<ConsoleOutput[]>>;
  onClose?: () => void;
};

export function Console({
  consoleOutputs,
  setConsoleOutputs,
  onClose,
}: ConsoleProps) {
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  const handleClear = useCallback(() => {
    setConsoleOutputs([]);
  }, [setConsoleOutputs]);

  useEffect(() => {
    if (!isArtifactVisible) {
      setConsoleOutputs([]);
    }
  }, [isArtifactVisible, setConsoleOutputs]);

  const output = useMemo(
    () =>
      [...consoleOutputs]
        .map((out, index) => {
          const prefix = `[${index + 1}]`;

          if (out.status === "in_progress") {
            return "";
          }
          if (out.status === "loading_packages") {
            const textParts = out.contents
              .filter((c) => c.type === "text")
              .map((c) => c.value);
            return `${prefix} ${textParts.join("")}`;
          }

          const textParts = out.contents
            .filter((c) => c.type === "text")
            .map((c) => c.value);
          return `${prefix} ${textParts.join("\n")}`;
        })
        .join("\n"),
    [consoleOutputs]
  );

  const isStreaming = consoleOutputs.some(
    (out) => out.status === "in_progress" || out.status === "loading_packages"
  );

  return (
    <Terminal
      className="size-full"
      isStreaming={isStreaming}
      onClear={handleClear}
      onClose={onClose}
      output={output}
    >
      <TerminalHeader>
        <TerminalTitle>
          <span>Terminal</span>
        </TerminalTitle>
        <TerminalStatus />
        <TerminalActions>
          <TerminalCopyButton />
          <TerminalClearButton />
          <TerminalCloseButton />
        </TerminalActions>
      </TerminalHeader>
      <TerminalContent />
    </Terminal>
  );
}
