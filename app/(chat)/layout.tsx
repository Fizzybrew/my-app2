import Script from "next/script";
import { ChatLayoutProvider } from "@/components/chat/chat-layout-provider";
import { DataStreamProvider } from "@/components/chat/data-stream-provider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="lazyOnload"
      />
      <DataStreamProvider>
        <ChatLayoutProvider>{children}</ChatLayoutProvider>
      </DataStreamProvider>
    </>
  );
}
