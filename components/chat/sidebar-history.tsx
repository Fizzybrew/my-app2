"use client";

import { isToday, isYesterday, subMonths, subWeeks } from "date-fns";
import { motion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "next-auth";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  useSidebar,
} from "@/components/ui/sidebar";
import type { Chat } from "@/lib/db/schema";
import { fetcher } from "@/lib/utils";
import { ChatItem } from "./sidebar-history-item";
import { Loader } from "lucide-react";

type GroupedChats = {
  today: Chat[];
  yesterday: Chat[];
  lastWeek: Chat[];
  lastMonth: Chat[];
  older: Chat[];
};

export type ChatHistory = {
  chats: Chat[];
  hasMore: boolean;
};

const PAGE_SIZE = 20;

export const groupChatsByDate = (chats: Chat[]): GroupedChats => {
  const now = new Date();
  const oneWeekAgo = subWeeks(now, 1);
  const oneMonthAgo = subMonths(now, 1);

  return chats.reduce(
    (groups, chat) => {
      const chatDate = new Date(chat.createdAt);

      if (isToday(chatDate)) {
        groups.today.push(chat);
      } else if (isYesterday(chatDate)) {
        groups.yesterday.push(chat);
      } else if (chatDate > oneWeekAgo) {
        groups.lastWeek.push(chat);
      } else if (chatDate > oneMonthAgo) {
        groups.lastMonth.push(chat);
      } else {
        groups.older.push(chat);
      }

      return groups;
    },
    {
      lastMonth: [],
      lastWeek: [],
      older: [],
      today: [],
      yesterday: [],
    } as GroupedChats,
  );
};

export function getChatHistoryPaginationKey(
  pageIndex: number,
  previousPageData: ChatHistory,
) {
  if (previousPageData && previousPageData.hasMore === false) return null;

  if (pageIndex === 0)
    return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/history?limit=${PAGE_SIZE}`;

  const firstChatFromPage = previousPageData.chats.at(-1);

  if (!firstChatFromPage) return null;

  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/history?ending_before=${firstChatFromPage.id}&limit=${PAGE_SIZE}`;
}

export function SidebarHistory({ user }: { user: User | undefined }) {
  const { setOpenMobile } = useSidebar();
  const pathname = usePathname();
  const id = pathname?.startsWith("/chat/") ? pathname.split("/")[2] : null;

  const {
    data: pinnedData,
    mutate: mutatePinned,
    isLoading: isPinnedLoading,
  } = useSWR<{ chats: Chat[]; hasMore: boolean }>(
    user
      ? `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/history?pinned=true`
      : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const {
    data: paginatedChatHistories,
    setSize,
    isValidating,
    isLoading,
    mutate,
  } = useSWRInfinite<ChatHistory>(
    user ? getChatHistoryPaginationKey : () => null,
    fetcher,
    { fallbackData: [], revalidateOnFocus: false },
  );

  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const hasReachedEnd = paginatedChatHistories
    ? paginatedChatHistories.some((page) => page.hasMore === false)
    : false;

  const hasEmptyChatHistory = paginatedChatHistories
    ? paginatedChatHistories.every((page) => page.chats.length === 0)
    : false;

  const handleDelete = useCallback(() => {
    const chatToDelete = deleteId;
    const isCurrentChat = pathname === `/chat/${chatToDelete}`;

    setShowDeleteDialog(false);

    if (isCurrentChat) router.replace("/");

    mutate((chatHistories) => {
      if (chatHistories) {
        return chatHistories.map((chatHistory) => ({
          ...chatHistory,
          chats: chatHistory.chats.filter((chat) => chat.id !== chatToDelete),
        }));
      }
    });

    mutatePinned((prev) => {
      if (prev) {
        return {
          ...prev,
          chats: prev.chats.filter((chat) => chat.id !== chatToDelete),
        };
      }
      return prev;
    });

    fetch(
      `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/chat?id=${chatToDelete}`,
      { method: "DELETE" },
    );

    toast.success("Chat deleted");
  }, [deleteId, mutate, mutatePinned, pathname, router]);

  const handleShowDeleteDialog = useCallback((chatId: string) => {
    setDeleteId(chatId);
    setShowDeleteDialog(true);
  }, []);

  const handlePinToggle = useCallback(
    async (chatId: string, newPinned: boolean) => {
      mutatePinned((prev) => {
        if (!prev) return prev;
        if (newPinned) {
          return prev;
        } else {
          return {
            ...prev,
            chats: prev.chats.filter((chat) => chat.id !== chatId),
          };
        }
      }, false);

      mutate((chatHistories) => {
        if (chatHistories) {
          return chatHistories.map((page) => ({
            ...page,
            chats: page.chats.map((chat) =>
              chat.id === chatId ? { ...chat, pinned: newPinned } : chat,
            ),
          }));
        }
        return chatHistories;
      }, false);

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/chat`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: chatId, pinned: newPinned }),
          },
        );
        if (!res.ok) throw new Error("Failed to update pin");
        await mutatePinned();
        toast.success(newPinned ? "Chat pinned" : "Chat unpinned");
      } catch (error) {
        toast.error("Failed to update pin");
        mutate();
        mutatePinned();
      }
    },
    [mutate, mutatePinned],
  );

  const handleRename = useCallback(
    async (chatId: string, newTitle: string) => {
      mutate((chatHistories) => {
        if (chatHistories) {
          return chatHistories.map((page) => ({
            ...page,
            chats: page.chats.map((chat) =>
              chat.id === chatId ? { ...chat, title: newTitle } : chat,
            ),
          }));
        }
        return chatHistories;
      }, false);

      mutatePinned((prev) => {
        if (prev) {
          return {
            ...prev,
            chats: prev.chats.map((chat) =>
              chat.id === chatId ? { ...chat, title: newTitle } : chat,
            ),
          };
        }
        return prev;
      }, false);

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/chat`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: chatId, title: newTitle }),
          },
        );
        if (!res.ok) throw new Error("Failed to rename");

        await mutate(undefined, { revalidate: true });
        await mutatePinned(undefined, { revalidate: true });

        toast.success("Chat renamed");
      } catch (error) {
        toast.error("Failed to rename chat");
        mutate();
        mutatePinned();
      }
    },
    [mutate, mutatePinned],
  );

  const handleViewportEnter = useCallback(() => {
    if (!isValidating && !hasReachedEnd) {
      setSize((size) => size + 1);
    }
  }, [hasReachedEnd, isValidating, setSize]);

  if (isLoading || isPinnedLoading) {
    return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel className="sr-only">History</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {Array.from({ length: 5 }).map((_, index) => (
              <SidebarMenuItem key={index}>
                <SidebarMenuSkeleton />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  const pinnedList = pinnedData?.chats || [];

  return (
    <>
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel className="sr-only">History</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {(() => {
              const chatsFromHistory = paginatedChatHistories
                ? paginatedChatHistories.flatMap((page) => page.chats)
                : [];
              const unPinnedChats = chatsFromHistory.filter(
                (chat) => !chat.pinned,
              );
              const groupedChats = groupChatsByDate(unPinnedChats);

              return (
                <div className="flex flex-col gap-4">
                  {pinnedList.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-sm text-muted-foreground font-semibold">
                        Pinned
                      </div>
                      {pinnedList.map((chat) => (
                        <ChatItem
                          key={chat.id}
                          chat={chat}
                          isActive={chat.id === id}
                          onDelete={handleShowDeleteDialog}
                          onPinToggle={handlePinToggle}
                          setOpenMobile={setOpenMobile}
                          onRename={handleRename}
                        />
                      ))}
                    </div>
                  )}

                  {groupedChats.today.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-sm text-muted-foreground font-semibold">
                        Today
                      </div>
                      {groupedChats.today.map((chat) => (
                        <ChatItem
                          key={chat.id}
                          chat={chat}
                          isActive={chat.id === id}
                          onDelete={handleShowDeleteDialog}
                          onPinToggle={handlePinToggle}
                          setOpenMobile={setOpenMobile}
                          onRename={handleRename}
                        />
                      ))}
                    </div>
                  )}

                  {groupedChats.yesterday.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-sm text-muted-foreground font-semibold">
                        Yesterday
                      </div>
                      {groupedChats.yesterday.map((chat) => (
                        <ChatItem
                          key={chat.id}
                          chat={chat}
                          isActive={chat.id === id}
                          onDelete={handleShowDeleteDialog}
                          onPinToggle={handlePinToggle}
                          setOpenMobile={setOpenMobile}
                          onRename={handleRename}
                        />
                      ))}
                    </div>
                  )}

                  {groupedChats.lastWeek.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-sm text-muted-foreground font-semibold">
                        Last 7 days
                      </div>
                      {groupedChats.lastWeek.map((chat) => (
                        <ChatItem
                          key={chat.id}
                          chat={chat}
                          isActive={chat.id === id}
                          onDelete={handleShowDeleteDialog}
                          onPinToggle={handlePinToggle}
                          setOpenMobile={setOpenMobile}
                          onRename={handleRename}
                        />
                      ))}
                    </div>
                  )}

                  {groupedChats.lastMonth.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-sm text-muted-foreground font-semibold">
                        Last 30 days
                      </div>
                      {groupedChats.lastMonth.map((chat) => (
                        <ChatItem
                          key={chat.id}
                          chat={chat}
                          isActive={chat.id === id}
                          onDelete={handleShowDeleteDialog}
                          onPinToggle={handlePinToggle}
                          setOpenMobile={setOpenMobile}
                          onRename={handleRename}
                        />
                      ))}
                    </div>
                  )}

                  {groupedChats.older.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-sm text-muted-foreground font-semibold">
                        Older
                      </div>
                      {groupedChats.older.map((chat) => (
                        <ChatItem
                          key={chat.id}
                          chat={chat}
                          isActive={chat.id === id}
                          onDelete={handleShowDeleteDialog}
                          onPinToggle={handlePinToggle}
                          setOpenMobile={setOpenMobile}
                          onRename={handleRename}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </SidebarMenu>

          <motion.div onViewportEnter={handleViewportEnter} />

          {hasReachedEnd ? null : (
            <div className="mt-1 flex flex-row items-center gap-2 px-4 py-2 text-sidebar-foreground/50">
              <div className="animate-spin">
                <Loader size={16} />
              </div>
              <div className="text-sm">Loading...</div>
            </div>
          )}
        </SidebarGroupContent>
      </SidebarGroup>

      <AlertDialog onOpenChange={setShowDeleteDialog} open={showDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              chat and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} variant="destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
