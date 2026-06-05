"use client";

import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function PasswordInput({ className, ...props }: React.ComponentProps<"input">) {
  const [show, setShow] = React.useState(false);

  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        className={cn("pr-8", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
        tabIndex={-1}
        className="absolute top-1/2 right-1 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {show ? <EyeSlashIcon size={16} /> : <EyeIcon size={16} />}
      </button>
    </div>
  );
}

export { PasswordInput };
