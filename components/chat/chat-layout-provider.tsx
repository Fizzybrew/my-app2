"use client";

import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { AppSidebar } from "@/components/chat/app-sidebar";
import { ChatShell } from "@/components/chat/shell";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toast";
import { ActiveChatProvider } from "@/hooks/use-active-chat";

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

function getCookie(name: string) {
  if (typeof document === "undefined") return null;

  const prefix = `${name}=`;
  const value = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  return value ? decodeURIComponent(value.slice(prefix.length)) : null;
}

export function ChatLayoutProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useIsomorphicLayoutEffect(() => {
    const stored = getCookie("sidebar_state");
    if (stored !== null) {
      setSidebarOpen(stored === "true");
    }
  }, []);

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <AppSidebar />
      <SidebarInset>
        <Toaster />
        <ActiveChatProvider>
          <ChatShell />
        </ActiveChatProvider>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
