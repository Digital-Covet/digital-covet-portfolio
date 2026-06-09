import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { AuthUser } from "@/types/auth.types";
import { AccountEmailDisplay } from "./account-email-display";
import { AccountNameForm } from "./account-name-form";
import { AvatarUpload } from "./avatar-upload";
import { TwoFactorReset } from "./two-factor-reset";

interface AccountSettingsShellProps {
  user: AuthUser;
}

export function AccountSettingsShell({ user }: AccountSettingsShellProps) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="space-y-2 pb-8">
        <CardTitle className="text-3xl font-semibold tracking-tight">
          Account
        </CardTitle>

        <CardDescription className="text-base">
          Manage your profile, security settings, and authentication methods.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-10">
        <section className="space-y-8">
          <AvatarUpload
            userName={user.name}
            currentImage={user.image ?? null}
          />

          <Separator />

          <AccountNameForm currentName={user.name} />

          <Separator />

          <AccountEmailDisplay email={user.email} />
        </section>

        <Separator />

        <section className="space-y-5">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Two-Factor Authentication
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Lost your authenticator app? Use a backup code to reset 2FA and
              enroll a new device.
            </p>
          </div>

          <TwoFactorReset />
        </section>
      </CardContent>
    </Card>
  );
}
