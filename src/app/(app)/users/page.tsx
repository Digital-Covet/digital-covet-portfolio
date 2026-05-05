import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { listUsers } from "@/actions/user";
import { UserManagement } from "@/components/users/user-management";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Users – Admin",
};

export default async function UsersPage() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "admin" && session.user.role !== "superadmin") {
    redirect("/dashboard");
  }

  const { users } = await listUsers();

  return (
    <UserManagement
      initialUsers={users}
      currentUserId={session.user.id}
      currentUserRole={session.user.role}
    />
  );
}
