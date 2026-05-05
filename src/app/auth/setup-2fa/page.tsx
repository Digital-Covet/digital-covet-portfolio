import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth.server";
import { Setup2FAContentWithSuspense } from "./setup-2fa-content";

export default async function Setup2FAPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/auth/login");
  }

  if (session.user.twoFactorEnabled) {
    redirect("/dashboard");
  }

  return <Setup2FAContentWithSuspense />;
}