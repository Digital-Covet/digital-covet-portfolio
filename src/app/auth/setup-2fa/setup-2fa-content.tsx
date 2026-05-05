"use client";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { toast } from "sonner";
import { TwoFactorSetup } from "@/components/two-factor-setup";
import { authClient } from "@/lib/auth-client";

function Setup2FAContent() {
  const router = useRouter();

const { refetch } = authClient.useSession();

    const handleComplete = async () => {
        toast.success("Two-factor authentication enabled!");

        await refetch();

    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <TwoFactorSetup onComplete={handleComplete} />
      </div>
    </div>
  );
}

export function Setup2FAContentWithSuspense() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading setup...</p>
        </div>
      }
    >
      <Setup2FAContent />
    </Suspense>
  );
}
