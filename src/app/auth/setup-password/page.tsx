import { redirect } from "next/navigation";
import { SetupPasswordForm } from "@/components/setup-password-form";
import { prisma } from "@/db";
import { ROUTES } from "@/lib/constants";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SetupPasswordPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const token =
    typeof searchParams.token === "string" ? searchParams.token : undefined;

  if (!token) {
    return (
      <InvitationError
        title="Invalid Link"
        message="The invitation link is missing a setup token."
      />
    );
  }

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    select: {
      email: true,
      expiresAt: true,
      usedAt: true,

      user: {
        select: { passwordChanged: true },
      },
    },
  });

  if (!invitation) {
    return (
      <InvitationError
        title="Invalid Link"
        message="The invitation token is invalid."
      />
    );
  }

  if (invitation.usedAt) {
    redirect(ROUTES.DASHBOARD);
  }

  if (invitation.expiresAt.getTime() < Date.now()) {
    return (
      <InvitationError
        title="Link Expired"
        message="This invitation link has expired. Please contact your administrator."
      />
    );
  }

  if (invitation.user?.passwordChanged) {
    redirect(ROUTES.DASHBOARD);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <div className="w-full max-w-md">
        <SetupPasswordForm email={invitation.email} token={token} />
      </div>
    </div>
  );
}

function InvitationError({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600">{title}</h1>
        <p className="mt-2 text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
