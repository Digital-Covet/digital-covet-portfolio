import { SetupPasswordForm } from "@/components/setup-password-form";
import { prisma } from "@/db";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SetupPasswordPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const token =
    typeof searchParams.token === "string" ? searchParams.token : undefined;

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Invalid Link</h1>
          <p className="mt-2 text-muted-foreground">
            The invitation link is missing a setup token.
          </p>
        </div>
      </div>
    );
  }

  const invitation = await prisma.invitation.findUnique({
    where: { token },
  });

  if (!invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Invalid Link</h1>
          <p className="mt-2 text-muted-foreground">
            The invitation token is invalid.
          </p>
        </div>
      </div>
    );
  }

  if (invitation.expiresAt.getTime() < Date.now()) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Link Expired</h1>
          <p className="mt-2 text-muted-foreground">
            This invitation link has expired. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: invitation.email },
  });

  if (user?.passwordChanged) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-green-600">Account Already Activated</h1>
          <p className="mt-2 text-muted-foreground">
            Your password has already been set up. Please log in normally.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <div className="w-full max-w-md">
        <SetupPasswordForm email={invitation.email} token={token} />
      </div>
    </div>
  );
}
