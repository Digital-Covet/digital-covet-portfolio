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
  const { data: session } = authClient.useSession();
  const userImage = session?.user?.image;
  const userName = session?.user?.name;
  const userEmail = session?.user?.email;

  const handleSignOut = async () => {
    try {
      const res = await fetch("/api/auth/end-session-url");
      const { url } = await res.json();

      await authClient.signOut();

      if (url) {
        window.location.href = url;
      } else {
        router.push("/login");
      }
    } catch {
      await authClient.signOut();
      router.push("/login");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none cursor-pointer flex items-center gap-2 p-1 border-0 bg-transparent w-full">
        {userImage ? (
          <img
            src={userImage}
            alt=""
            className="size-8 rounded-full object-cover"
          />
        ) : (
          <Avatar className="size-8" />
        )}
        {(userName || userEmail) && (
          <div className="flex flex-col items-start min-w-0">
            {userName && (
              <span className="text-sm font-medium truncate">{userName}</span>
            )}
            {userEmail && (
              <span className="text-xs text-muted-foreground truncate">{userEmail}</span>
            )}
          </div>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuItem
          onClick={() =>
            router.push("https://iam.digitalcovet.com/account-settings")
          }
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
