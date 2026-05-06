import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth.server";
import { ROUTES } from "@/lib/constants";
import { Setup2FAContentWithSuspense } from "./setup-2fa-content";

export default async function Setup2FAPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect(ROUTES.LOGIN);
  }

  if (!session.user.passwordChanged) {
    redirect(ROUTES.SETUP_PASSWORD);
  }

  if (session.user.twoFactorEnabled) {
    redirect(ROUTES.DASHBOARD);
  }

  return <Setup2FAContentWithSuspense />;
}
