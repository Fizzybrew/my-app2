import { cookies } from "next/headers";
import Script from "next/script";
import { Suspense } from "react";
import { AppSidebar } from "@/components/chat/app-sidebar";
import { DataStreamProvider } from "@/components/chat/data-stream-provider";
import { ChatShell } from "@/components/chat/shell";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toast";
import { ActiveChatProvider } from "@/hooks/use-active-chat";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { getModel } from "@/lib/ai/providers";
import { auth } from "../(auth)/auth";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="lazyOnload"
      />
      <DataStreamProvider>
        <Suspense fallback={<ChatLayoutFallback />}>
          <SidebarShell>{children}</SidebarShell>
        </Suspense>
      </DataStreamProvider>
    </>
  );
}

function ChatLayoutFallback() {
  return (
    <div className="flex h-dvh w-full bg-background">
      <aside className="hidden w-64 shrink-0 border-r bg-sidebar md:block" />
      <main className="flex min-w-0 flex-1 flex-col bg-background">
        <div className="h-12 shrink-0 border-b bg-background/80" />
        <div className="flex min-h-0 flex-1 flex-col" />
        <div className="mx-auto mb-6 h-20 w-full max-w-3xl rounded-3xl border bg-background" />
      </main>
    </div>
  );
}

async function SidebarShell({ children }: { children: React.ReactNode }) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get("sidebar_state")?.value !== "true";

  const cookieModelId = cookieStore.get("chat-model")?.value;
  const requestedModelId = cookieModelId || DEFAULT_CHAT_MODEL;
  const model = await getModel(requestedModelId);

  const initialModelId = model?.id ?? DEFAULT_CHAT_MODEL;
  const initialModelName =
    model?.name ||
    cookieStore.get("chat-model-name")?.value ||
    "DeepSeek V4 Flash";

  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <AppSidebar user={session?.user} />
      <SidebarInset>
        <Toaster />
        <ActiveChatProvider
          initialModelId={initialModelId}
          initialModelName={initialModelName}
        >
          <ChatShell />
        </ActiveChatProvider>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
