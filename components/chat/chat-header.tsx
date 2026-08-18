import { Astroid } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function ChatHeader() {
  return (
    <header className="absolute top-0 inset-x-0 z-10 px-4 py-2 flex items-center justify-between pointer-events-none">
      <SidebarTrigger
        className="pointer-events-auto md:hidden"
        variant="outline"
      />

      <Button
        aria-label="Upgrade"
        className="pointer-events-auto ml-auto hidden"
        nativeButton={false}
        render={
          <Link
            href="/сделать ссылку на страничку с ценами"
            rel="noopener noreferrer"
            target="_blank"
          />
        }
      >
        <Astroid fill="currentColor" />
        Upgrade
      </Button>
    </header>
  );
}
