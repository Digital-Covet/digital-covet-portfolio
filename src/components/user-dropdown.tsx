"use client";

import { GearIcon, SignOutIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import Avatar from "@/assets/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";

export function UserDropdown() {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none cursor-pointer rounded-full overflow-hidden p-0 border-0 bg-transparent">
        <Avatar className="size-8" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuItem
          onClick={() => router.push("/account/settings")}
          className="cursor-pointer"
        >
          <GearIcon />
          Account Settings
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleSignOut}
          variant="destructive"
          className="cursor-pointer"
        >
          <SignOutIcon />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
