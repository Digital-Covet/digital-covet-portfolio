import {
  emailOTPClient,
  genericOAuthClient,
  twoFactorClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL:
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? window.location.origin,
  plugins: [
    twoFactorClient(),
    emailOTPClient(),
    genericOAuthClient(),
  ],
});
