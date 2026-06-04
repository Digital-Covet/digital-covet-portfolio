import Link from "next/link";
import { redirect } from "next/navigation";
import { SetupPasswordForm } from "@/components/setup-password-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/db";
import { getSession } from "@/lib/auth.server";
import { ROUTES } from "@/lib/constants";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SetupPasswordPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const token =
    typeof searchParams.token === "string" ? searchParams.token : undefined;

  const session = await getSession();

  if (session?.user) {
    const hasCredential = await prisma.account.findFirst({
      where: { userId: session.user.id, providerId: "credential" },
      select: { id: true },
    });

    if (hasCredential) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { passwordChanged: true },
      });

      redirect(ROUTES.SETUP_2FA);
    }

    if (!token) {
      return (
        <InvitationError
          title="Account Setup Required"
          message="You need to set up your password before accessing your account. Please use the invitation link sent to your email to complete setup."
          helpText="Check your inbox for the invitation email, or contact your administrator if you need a new link."
          showLoginLink
        />
      );
    }
  } else if (!token) {
    return (
      <InvitationError
        title="Account Setup Required"
        message="You need to set up your password before accessing your account. Please use the invitation link sent to your email to complete setup."
        helpText="Check your inbox for the invitation email, or contact your administrator if you need a new link."
        showLoginLink
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
        select: { passwordChanged: true, email: true },
      },
    },
  });

  if (!invitation) {
    return (
      <InvitationError
        title="Invalid Invitation Link"
        message="This invitation link is not valid. It may have been copied incorrectly or the link may be broken."
        helpText="Please request a new invitation link from your administrator, or check your email for the correct link."
        showLoginLink
      />
    );
  }

  if (invitation.usedAt) {
    const user = await prisma.user.findUnique({
      where: { email: invitation.email },
      select: { id: true },
    });

    if (user) {
      const hasCredential = await prisma.account.findFirst({
        where: { userId: user.id, providerId: "credential" },
        select: { id: true },
      });

      if (hasCredential) {
        return (
          <InvitationError
            title="Account Already Activated"
            message="Your account has already been set up. You can sign in with your email and password."
            helpText="If you've forgotten your password, use the 'Forgot password?' link on the login page."
            showLoginLink
            showForgotPasswordLink
          />
        );
      }
    }

    redirect(ROUTES.DASHBOARD);
  }

  if (invitation.expiresAt.getTime() < Date.now()) {
    return (
      <InvitationError
        title="Invitation Expired"
        message="This invitation link has expired. Invitation links are valid for 7 days."
        helpText="Please contact your administrator to request a new invitation."
        showLoginLink
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
  helpText,
  showLoginLink = false,
  showForgotPasswordLink = false,
}: {
  title: string;
  message: string;
  helpText?: string;
  showLoginLink?: boolean;
  showForgotPasswordLink?: boolean;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-red-600">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{message}</p>
          {helpText && (
            <p className="text-sm text-muted-foreground">{helpText}</p>
          )}
          <div className="flex flex-col gap-2 pt-2">
            {showLoginLink && (
              <Button
                variant="default"
                className="w-full"
                render={<Link href={ROUTES.LOGIN}>Go to Login</Link>}
              />
            )}
            {showForgotPasswordLink && (
              <Button
                variant="outline"
                className="w-full"
                render={
                  <Link href={ROUTES.FORGOT_PASSWORD}>Forgot Password?</Link>
                }
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
