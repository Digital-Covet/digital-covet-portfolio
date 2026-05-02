import type { Metadata } from "next";
import TwoFactorVerify from "@/components/two-factor-verify";

export const metadata: Metadata = {
  title: "Verify 2FA | Secure Login",
};

export default function Verify2FAPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 p-8 shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Two-Factor Authentication
          </h1>
          <p className="mt-2 text-sm">
            Enter your security code to complete sign-in.
          </p>
        </div>

        <TwoFactorVerify />
      </div>
    </div>
  );
}
