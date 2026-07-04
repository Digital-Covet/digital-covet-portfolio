import {
  emailOTPClient,
  genericOAuthClient,
  jwtClient,
  twoFactorClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: "https://iam.digitalcovet.com",
  plugins: [
    twoFactorClient(),
    emailOTPClient(),
    genericOAuthClient(),
    jwtClient(),
  ],
});
