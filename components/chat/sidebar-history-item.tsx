"use client";

import Link from "next/link";
import { memo, useCallback, useState, useRef, useEffect } from "react";
import type { Chat } from "@/lib/db/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../ui/sidebar";
import { Trash, Pin, PinOff, Pencil, Ellipsis, Forward } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

const PureChatItem = ({
  chat,
  isActive,
  onDelete,
  onPinToggle,
  onRename,
  setOpenMobile,
}: {
  chat: Chat;
  isActive: boolean;
  onDelete: (chatId: string) => void;
  onPinToggle: (chatId: string, newPinned: boolean) => void;
  onRename?: (chatId: string, newTitle: string) => void;
  setOpenMobile: (open: boolean) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(chat.title);
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const closeMobile = useCallback(() => {
    setOpenMobile(false);
  }, [setOpenMobile]);

  const handleDelete = useCallback(() => {
    onDelete(chat.id);
  }, [chat.id, onDelete]);

  const handlePinToggle = useCallback(() => {
    onPinToggle(chat.id, !chat.pinned);
  }, [chat.id, chat.pinned, onPinToggle]);

  const startEditing = useCallback(() => {
    setIsEditing(true);
    setEditValue(chat.title);
  }, [chat.title]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
  }, []);

  const saveEditing = useCallback(() => {
    const newTitle = editValue.trim();
    if (newTitle && newTitle !== chat.title) {
      if (typeof onRename === "function") {
        onRename(chat.id, newTitle);
      } else {
        console.warn("onRename is not a function for chat", chat.id);
      }
    }
    setIsEditing(false);
  }, [editValue, chat.id, chat.title, onRename]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        saveEditing();
      } else if (e.key === "Escape") {
        cancelEditing();
      }
    },
    [saveEditing, cancelEditing],
  );

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const shareUrl = `${window.location.origin}/chat/${chat.id}`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [shareUrl]);

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild={!isEditing}
          className="h-9 rounded-md"
          isActive={isActive}
        >
          {isEditing ? (
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={saveEditing}
              onKeyDown={handleKeyDown}
              className="h-9 w-full bg-transparent text-sm"
            />
          ) : (
            <Link href={`/chat/${chat.id}`} onClick={closeMobile}>
              <div className="flex items-center gap-1 truncate text-sm">
                <span className="truncate">{chat.title}</span>
              </div>
            </Link>
          )}
        </SidebarMenuButton>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuAction showOnHover={!isActive}>
              <Ellipsis />
              <span className="sr-only">More</span>
            </SidebarMenuAction>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" side="bottom">
            <DropdownMenuItem onSelect={handlePinToggle}>
              {chat.pinned ? <PinOff /> : <Pin />}
              <span>{chat.pinned ? "Unpin" : "Pin"}</span>
            </DropdownMenuItem>

            <DropdownMenuItem onSelect={startEditing}>
              <Pencil />
              <span>Rename</span>
            </DropdownMenuItem>

            <DropdownMenuItem onSelect={() => setShareOpen(true)}>
              <Forward />
              <span>Share</span>
            </DropdownMenuItem>

            <DropdownMenuItem onSelect={handleDelete} variant="destructive">
              <Trash />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Share chat link</DialogTitle>
            <DialogDescription>
              Anyone with the link can view your shared conversation. Check for
              any confidential or personal information.
            </DialogDescription>
          </DialogHeader>
          <Input readOnly value={shareUrl} className="w-full" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareOpen(false)}>
              Close
            </Button>
            <Button onClick={handleCopy}>{copied ? "Copied!" : "Copy"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export const ChatItem = memo(PureChatItem, (prevProps, nextProps) => {
  return prevProps.isActive === nextProps.isActive;
});
