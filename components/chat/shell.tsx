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
import { Greeting } from "./greeting";
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
    setCurrentModelId,
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

  const isNewChat = !isLoading && messages.length === 0;

  const inputElement = !isReadonly && (
    <MultimodalInput
      attachments={attachments}
      chatId={chatId}
      input={input}
      isLoading={isLoading}
      messages={messages}
      onModelChange={setCurrentModelId}
      selectedModelId={currentModelId}
      sendMessage={sendMessage}
      setAttachments={setAttachments}
      setInput={setInput}
      setMessages={setMessages}
      status={status}
      stop={stop}
    />
  );

  return (
    <>
      <div className="flex h-dvh w-full flex-row overflow-hidden">
        <div
          className={cn(
            "flex flex-col bg-sidebar transition-[width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
            isArtifactVisible ? "w-[40%] max-md:hidden" : "w-full",
          )}
        >
          <div className="relative flex flex-1 flex-col bg-background">
            <ChatHeader className="absolute top-0 inset-x-0 z-100" />
            {isNewChat ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-full max-w-3xl px-4">
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-8 w-full flex justify-center">
                    <Greeting />
                  </div>
                  {inputElement}
                </div>
              </div>
            ) : (
              <>
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
                <div className="absolute bottom-0 inset-x-0 z-100 mx-auto flex w-full max-w-3xl bg-background/50 rounded-t-full pb-6">
                  {inputElement}
                </div>
              </>
            )}
          </div>
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
