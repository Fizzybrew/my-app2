import Script from "next/script";
import { Suspense } from "react";
import { AppSidebar } from "@/components/chat/app-sidebar";
import { DataStreamProvider } from "@/components/chat/data-stream-provider";
import { ChatShell } from "@/components/chat/shell";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toast";
import { ActiveChatProvider } from "@/hooks/use-active-chat";
import { auth } from "../(auth)/auth";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="lazyOnload"
      />
      <DataStreamProvider>
        <SidebarProvider defaultOpen>
          <Suspense fallback={<AppSidebar user={undefined} />}>
            <AuthenticatedSidebar />
          </Suspense>
          <SidebarInset>
            <Toaster />
            <ActiveChatProvider>
              <ChatShell />
            </ActiveChatProvider>
            {children}
          </SidebarInset>
        </SidebarProvider>
      </DataStreamProvider>
    </>
  );
}

async function AuthenticatedSidebar() {
  const session = await auth();
  return <AppSidebar user={session?.user} />;
}
