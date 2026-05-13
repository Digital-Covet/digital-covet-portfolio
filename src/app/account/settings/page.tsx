import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import { AccountSettingsShell } from "@/components/account/account-settings-shell";
import { getCurrentUser } from "@/lib/auth.server";

export default async function AccountSettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-muted/30 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeftIcon size={16} className="mr-1" />
          Back to Dashboard
        </Link>
        <AccountSettingsShell user={user} />
      </div>
    </div>
  );
}
