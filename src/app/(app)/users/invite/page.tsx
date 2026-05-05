import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { InviteAdminForm } from "@/components/users/invite-form";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Invite User – Admin",
};

export default async function InviteUserPage() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "admin" && session.user.role !== "superadmin") {
    redirect("/dashboard");
  }

  return <InviteAdminForm currentUserRole={session.user.role} />;
}