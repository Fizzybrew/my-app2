"use client";

import { useEffect, useRef, useState } from "react";
import { useActiveChat } from "@/hooks/use-active-chat";
import {
  initialArtifactData,
  useArtifact,
  useArtifactSelector,
} from "@/hooks/use-artifact";
import type { Attachment } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Artifact } from "./artifact";
import { ChatHeader } from "./chat-header";
import { DataStreamHandler } from "./data-stream-handler";
import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";

export function ChatShell() {
  const {
    chatId,
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    addToolApprovalResponse,
    input,
    setInput,
    isReadonly,
    isLoading,
    votes,
    currentModelId,
    currentModelName,
    currentModelCapabilities,
    setCurrentModel,
  } = useActiveChat();

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);
  const { setArtifact } = useArtifact();

  const stopRef = useRef(stop);
  stopRef.current = stop;

  const prevChatIdRef = useRef(chatId);
  useEffect(() => {
    if (prevChatIdRef.current !== chatId) {
      prevChatIdRef.current = chatId;
      stopRef.current();
      setArtifact(initialArtifactData);
      setAttachments([]);
    }
  }, [chatId, setArtifact]);

  return (
    <>
      <div className="flex h-dvh w-full flex-row overflow-hidden">
        <div
          className={cn(
            "relative flex flex-col transition-[width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
            isArtifactVisible ? "w-[40%]" : "w-full",
          )}
        >
          <ChatHeader />
          <Messages
            addToolApprovalResponse={addToolApprovalResponse}
            chatId={chatId}
            isArtifactVisible={isArtifactVisible}
            isLoading={isLoading}
            isReadonly={isReadonly}
            messages={messages}
            regenerate={regenerate}
            selectedModelId={currentModelId}
            setMessages={setMessages}
            status={status}
            votes={votes}
          />
          {!isReadonly && (
            <div className="absolute bottom-6 left-0 right-0 z-10 mx-auto max-w-3xl px-4">
              <MultimodalInput
                attachments={attachments}
                chatId={chatId}
                currentModelCapabilities={currentModelCapabilities}
                currentModelName={currentModelName}
                input={input}
                isLoading={isLoading}
                messages={messages}
                onModelChange={setCurrentModel}
                selectedModelId={currentModelId}
                sendMessage={sendMessage}
                setAttachments={setAttachments}
                setInput={setInput}
                setMessages={setMessages}
                status={status}
                stop={stop}
              />
            </div>
          )}
        </div>

        <Artifact
          addToolApprovalResponse={addToolApprovalResponse}
          attachments={attachments}
          chatId={chatId}
          input={input}
          isReadonly={isReadonly}
          messages={messages}
          regenerate={regenerate}
          selectedModelId={currentModelId}
          sendMessage={sendMessage}
          setAttachments={setAttachments}
          setInput={setInput}
          setMessages={setMessages}
          status={status}
          stop={stop}
          votes={votes}
        />
      </div>
      <DataStreamHandler />
    </>
  );
}
