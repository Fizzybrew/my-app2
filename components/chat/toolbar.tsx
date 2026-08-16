"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import cx from "classnames";
import { ArrowDownWideNarrow, ArrowUp, Square, WrenchIcon } from "lucide-react";
import { motion, useMotionValue, useTransform } from "motion/react";
import { nanoid } from "nanoid";
import {
  type Dispatch,
  isValidElement,
  memo,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useOnClickOutside } from "usehooks-ts";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ChatMessage } from "@/lib/types";
import { type ArtifactKind, artifactDefinitions } from "./artifact";
import type { ArtifactToolbarItem } from "./create-artifact";

const MotionButton = motion.create(Button);

type ToolProps = {
  description: string;
  icon: ReactNode;
  selectedTool: string | null;
  setSelectedTool: Dispatch<SetStateAction<string | null>>;
  isToolbarVisible?: boolean;
  setIsToolbarVisible?: Dispatch<SetStateAction<boolean>>;
  isAnimating: boolean;
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  onClick: ({
    sendMessage,
  }: {
    sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  }) => void;
};

const READING_LEVELS = [
  "Elementary",
  "Middle School",
  "Keep current level",
  "High School",
  "College",
  "Graduate",
];

const Tool = ({
  description,
  icon,
  selectedTool,
  setSelectedTool,
  isToolbarVisible,
  setIsToolbarVisible,
  isAnimating,
  sendMessage,
  onClick,
}: ToolProps) => {
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (selectedTool !== description) {
      setIsHovered(false);
    }
  }, [selectedTool, description]);

  const handleSelect = useCallback(() => {
    if (!isToolbarVisible && setIsToolbarVisible) {
      setIsToolbarVisible(true);
      return;
    }

    if (!selectedTool) {
      setIsHovered(true);
      setSelectedTool(description);
      return;
    }

    if (selectedTool === description) {
      setSelectedTool(null);
      onClick({ sendMessage });
    } else {
      setSelectedTool(description);
    }
  }, [
    description,
    isToolbarVisible,
    onClick,
    selectedTool,
    sendMessage,
    setIsToolbarVisible,
    setSelectedTool,
  ]);

  const handleHoverEnd = useCallback(() => {
    if (selectedTool !== description) {
      setIsHovered(false);
    }
  }, [description, selectedTool]);

  const handleHoverStart = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter") {
        handleSelect();
      }
    },
    [handleSelect]
  );

  return (
    <Tooltip open={isHovered && !isAnimating}>
      <TooltipTrigger
        render={
          <MotionButton
            animate={{ opacity: 1, transition: { delay: 0.1 } }}
            aria-label={description}
            exit={{
              opacity: 0,
              scale: 0.9,
              transition: { duration: 0.1 },
            }}
            initial={{ opacity: 0, scale: 1 }}
            onClick={handleSelect}
            onHoverEnd={handleHoverEnd}
            onHoverStart={handleHoverStart}
            onKeyDown={handleKeyDown}
            size="icon"
            variant={selectedTool === description ? "default" : "ghost"}
          />
        }
      >
        {selectedTool === description ? (
          <ArrowUp />
        ) : isValidElement(icon) ? (
          icon
        ) : null}
      </TooltipTrigger>
      <TooltipContent side="left">{description}</TooltipContent>
    </Tooltip>
  );
};

const randomArr = [...new Array(6)].map((_x) => nanoid(5));

const ReadingLevelSelector = ({
  setSelectedTool,
  sendMessage,
  isAnimating,
}: {
  setSelectedTool: Dispatch<SetStateAction<string | null>>;
  isAnimating: boolean;
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
}) => {
  const y = useMotionValue(-40 * 2);
  const dragConstraints = 5 * 40 + 2;
  const yToLevel = useTransform(y, [0, -dragConstraints], [0, 5]);

  const [currentLevel, setCurrentLevel] = useState(2);
  const [hasUserSelectedLevel, setHasUserSelectedLevel] =
    useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = yToLevel.on("change", (latest) => {
      const level = Math.min(5, Math.max(0, Math.round(Math.abs(latest))));
      setCurrentLevel(level);
    });

    return () => unsubscribe();
  }, [yToLevel]);

  const handleClick = useCallback(() => {
    if (currentLevel !== 2 && hasUserSelectedLevel) {
      sendMessage({
        parts: [
          {
            text: `Please adjust the reading level to ${READING_LEVELS[currentLevel]} level.`,
            type: "text",
          },
        ],
        role: "user",
      });

      setSelectedTool(null);
    }
  }, [currentLevel, hasUserSelectedLevel, sendMessage, setSelectedTool]);

  const handleDragEnd = useCallback(() => {
    if (currentLevel === 2) {
      setSelectedTool(null);
    } else {
      setHasUserSelectedLevel(true);
    }
  }, [currentLevel, setSelectedTool]);

  const handleDragStart = useCallback(() => {
    setHasUserSelectedLevel(false);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-end">
      {randomArr.map((id) => (
        <motion.div
          animate={{ opacity: 1 }}
          className="flex size-10 flex-row items-center justify-center"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          key={id}
          transition={{ delay: 0.1 }}
        >
          <div className="size-2 rounded-full bg-muted-foreground/40" />
        </motion.div>
      ))}

      <TooltipProvider>
        <Tooltip open={!isAnimating}>
          <TooltipTrigger
            render={
              <motion.div
                className={cx(
                  "absolute flex flex-row items-center rounded-full border bg-background p-3",
                  {
                    "bg-background text-foreground": currentLevel === 2,
                    "bg-primary text-primary-foreground": currentLevel !== 2,
                  }
                )}
                drag="y"
                dragConstraints={{ bottom: 0, top: -dragConstraints }}
                dragElastic={0}
                dragMomentum={false}
                onClick={handleClick}
                onDragEnd={handleDragEnd}
                onDragStart={handleDragStart}
                style={{ y }}
                transition={{ duration: 0.1 }}
              />
            }
          >
            {currentLevel === 2 ? <ArrowDownWideNarrow /> : <ArrowUp />}
          </TooltipTrigger>
          <TooltipContent side="left">
            {READING_LEVELS[currentLevel]}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export const Tools = ({
  selectedTool,
  setSelectedTool,
  sendMessage,
  isAnimating,
  tools,
}: {
  selectedTool: string | null;
  setSelectedTool: Dispatch<SetStateAction<string | null>>;
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  isAnimating: boolean;
  tools: ArtifactToolbarItem[];
}) => (
  <motion.div
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col gap-0.5"
    exit={{ opacity: 0, scale: 0.95 }}
    initial={{ opacity: 0, scale: 0.95 }}
  >
    {[...tools].reverse().map((tool) => (
      <Tool
        aria-label={tool.description}
        description={tool.description}
        icon={tool.icon}
        isAnimating={isAnimating}
        key={tool.description}
        onClick={tool.onClick}
        selectedTool={selectedTool}
        sendMessage={sendMessage}
        setSelectedTool={setSelectedTool}
      />
    ))}
  </motion.div>
);

const createFixErrorTool = (
  consoleOutput: string,
  documentId?: string
): ArtifactToolbarItem => ({
  description: "Fix error",
  icon: <WrenchIcon className="size-4" />,
  onClick: ({ sendMessage: send }) => {
    send({
      parts: [
        {
          text: `Fix the error in the existing script${documentId ? ` (id: ${documentId})` : ""} using updateDocument. Do not create a new script. Console error:\n\n${consoleOutput}`,
          type: "text",
        },
      ],
      role: "user",
    });
  },
});

const PureToolbar = ({
  isToolbarVisible: _isToolbarVisible,
  setIsToolbarVisible,
  sendMessage,
  status,
  stop,
  setMessages,
  artifactKind,
  consoleError,
  documentId,
  artifactActions,
}: {
  isToolbarVisible: boolean;
  setIsToolbarVisible: Dispatch<SetStateAction<boolean>>;
  status: UseChatHelpers<ChatMessage>["status"];
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  stop: UseChatHelpers<ChatMessage>["stop"];
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  artifactKind: ArtifactKind;
  consoleError?: string;
  documentId?: string;
  artifactActions?: ReactNode;
}) => {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useOnClickOutside(toolbarRef, () => {
    setIsToolbarVisible(false);
    setSelectedTool(null);
  });

  const startCloseTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setSelectedTool(null);
      setIsToolbarVisible(false);
    }, 2000);
  }, [setIsToolbarVisible]);

  const cancelCloseTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    },
    []
  );

  useEffect(() => {
    if (status === "streaming") {
      setIsToolbarVisible(false);
    }
  }, [status, setIsToolbarVisible]);

  const handleAnimationComplete = useCallback(() => {
    setIsAnimating(false);
  }, []);

  const handleAnimationStart = useCallback(() => {
    setIsAnimating(true);
  }, []);

  const handleHoverEnd = useCallback(() => {
    if (status === "streaming") {
      return;
    }

    startCloseTimer();
  }, [startCloseTimer, status]);

  const handleHoverStart = useCallback(() => {
    if (status === "streaming") {
      return;
    }

    cancelCloseTimer();
    setIsToolbarVisible(true);
  }, [cancelCloseTimer, setIsToolbarVisible, status]);

  const handleStop = useCallback(() => {
    stop();
    setMessages((messages) => messages);
  }, [setMessages, stop]);

  const artifactDefinition = artifactDefinitions.find(
    (definition) => definition.kind === artifactKind
  );

  if (!artifactDefinition) {
    throw new Error("Artifact definition not found!");
  }

  const toolsByArtifactKind = consoleError
    ? [
        createFixErrorTool(consoleError, documentId),
        ...artifactDefinition.toolbar.slice(1),
      ]
    : artifactDefinition.toolbar;

  if (toolsByArtifactKind.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <motion.div
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="fixed right-6 bottom-6 z-50 flex cursor-pointer flex-col items-center rounded-3xl gap-0.5 border bg-background py-1 shadow-lg"
        exit={{ opacity: 0, transition: { duration: 0.1 }, y: -20 }}
        initial={{ opacity: 0, scale: 1, y: -20 }}
        onAnimationComplete={handleAnimationComplete}
        onAnimationStart={handleAnimationStart}
        onHoverEnd={handleHoverEnd}
        onHoverStart={handleHoverStart}
        ref={toolbarRef}
        transition={{ damping: 25, stiffness: 300, type: "spring" }}
      >
        {status === "submitted" || status === "streaming" ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <MotionButton
                  animate={{ scale: 1.4 }}
                  aria-label="Stop generating"
                  exit={{ scale: 1 }}
                  initial={{ scale: 1 }}
                  key="stop-icon"
                  onClick={handleStop}
                  size="icon"
                  variant="ghost"
                />
              }
            >
              <Square fill="currentColor" />
            </TooltipTrigger>
            <TooltipContent side="left">Stop generating</TooltipContent>
          </Tooltip>
        ) : selectedTool === "adjust-reading-level" ? (
          <ReadingLevelSelector
            isAnimating={isAnimating}
            key="reading-level-selector"
            sendMessage={sendMessage}
            setSelectedTool={setSelectedTool}
          />
        ) : (
          <>
            {artifactActions}
            <Tools
              isAnimating={isAnimating}
              key="tools"
              selectedTool={selectedTool}
              sendMessage={sendMessage}
              setSelectedTool={setSelectedTool}
              tools={toolsByArtifactKind}
            />
          </>
        )}
      </motion.div>
    </TooltipProvider>
  );
};

export const Toolbar = memo(PureToolbar, (prevProps, nextProps) => {
  if (prevProps.status !== nextProps.status) {
    return false;
  }
  if (prevProps.isToolbarVisible !== nextProps.isToolbarVisible) {
    return false;
  }
  if (prevProps.artifactKind !== nextProps.artifactKind) {
    return false;
  }
  if (prevProps.consoleError !== nextProps.consoleError) {
    return false;
  }
  if (prevProps.artifactActions !== nextProps.artifactActions) {
    return false;
  }

  return true;
});
