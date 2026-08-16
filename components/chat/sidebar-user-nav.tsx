"use client";

import { LogIn, LogOut, Settings, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import type { User } from "next-auth";
import { signOut, useSession } from "next-auth/react";
import { useCallback } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { toast } from "@/components/ui/toast";
import { guestRegex } from "@/lib/constants";

export function SidebarUserNav({ user }: { user: User }) {
  const router = useRouter();
  const { data, status } = useSession();

  const isGuest = guestRegex.test(data?.user?.email ?? "");

  const handleAuthClick = useCallback(() => {
    if (status === "loading") {
      toast.add({
        title: "Checking authentication status, please try again!",
        type: "error",
      });
      return;
    }
    if (isGuest) {
      router.push("/login");
    } else {
      signOut({ redirectTo: "/" });
    }
  }, [isGuest, router, status]);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              status === "loading" ? (
                <SidebarMenuButton />
              ) : (
                <SidebarMenuButton data-testid="user-nav-button">
                  <UserRound />
                  <span data-testid="user-email">
                    {isGuest ? "Guest" : user?.email}
                  </span>
                </SidebarMenuButton>
              )
            }
          />
          <DropdownMenuContent data-testid="user-nav-menu" side="top">
            <DropdownMenuItem>
              <Settings />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              data-testid="user-nav-item-auth"
              onClick={handleAuthClick}
            >
              {isGuest ? (
                <>
                  <LogIn />
                  <span>Sign in</span>
                </>
              ) : (
                <>
                  <LogOut />
                  <span>Sign out</span>
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
