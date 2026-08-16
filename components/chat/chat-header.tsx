import { Astroid } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function ChatHeader({ className }: { className?: string }) {
  return (
    <header
      className={cn(
        "absolute top-0 right-0 left-0 z-10 px-4 py-2 flex items-center justify-between pointer-events-none",
        className,
      )}
    >
      <SidebarTrigger
        variant="outline"
        className="pointer-events-auto md:hidden"
      />

      <Button
        className="pointer-events-auto ml-auto"
        aria-label="Upgrade"
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
