import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import {
  admin as adminPlugin,
  emailOTP,
  genericOAuth,
  twoFactor,
} from "better-auth/plugins";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { prisma } from "@/db";
import { sendEmail } from "@/services/email";
import { renderDeleteVerificationEmail } from "@/services/email-templates";
import { ac, adminRole, employeeRole, superadminRole } from "./permission";

const IAM_URL = (process.env.IAM_URL ?? "").replace(/\/+$/, "");

const iamJwks = createRemoteJWKSet(
  new URL(`${IAM_URL}/api/auth/jwks`),
);

const oauthClientSecret = process.env.OAUTH_CLIENT_SECRET;
if (!oauthClientSecret) {
  throw new Error(
    "[auth] OAUTH_CLIENT_SECRET is not set — required for the 'portfolio' genericOAuth client",
  );
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [
    "https://iam.digitalcovet.com",
    "https://portfolio.digitalcovet.com",
    "http://localhost:3000",
  ],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    cookiePrefix: process.env.NODE_ENV === "production"
      ? "__Secure-better-auth"
      : "better-auth",
  },
  user: {
    additionalFields: {
      departmentId: {
        type: "string",
        required: false,
        defaultValue: null,
      },
      passwordChanged: {
        type: "boolean",
        required: false,
        defaultValue: false,
      },
      twoFactorEnabled: {
        type: "boolean",
        required: false,
        defaultValue: false,
      },
    },
  },
  plugins: [
    twoFactor({
      issuer: "Digital Covet",
    }),
    adminPlugin({
      defaultRole: "employee",
      ac,
      roles: {
        superadmin: superadminRole,
        admin: adminRole,
        employee: employeeRole,
      },
    }),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        const username = email.split("@")[0];
        const { html, text } = renderDeleteVerificationEmail({
          username,
          otp,
        });
        const subject =
          type === "sign-in"
            ? "Your verification code"
            : type === "email-verification"
              ? "Verify your email"
              : "Reset your password";
        try {
          await sendEmail({
            to: email,
            subject,
            text,
            html,
          });
        } catch (error) {
          console.error(
            "[Auth Hook] Failed to send OTP email:",
            error instanceof Error ? error.message : error,
          );
          throw new Error("Failed to send verification code.");
        }
      },
    }),
    genericOAuth({
      config: [
        {
          providerId: "portfolio",
          discoveryUrl: `${IAM_URL}/api/auth/.well-known/openid-configuration`,
          clientId: "portfolio",
          clientSecret: oauthClientSecret,
          scopes: ["openid", "profile", "email"],
          pkce: true,
          redirectURI: `${process.env.BETTER_AUTH_URL}/api/auth/oauth2/callback/portfolio`,
          getUserInfo: async (tokens) => {
            const idToken = tokens.raw?.id_token as string | undefined;

            let userId: string;
            let claimedEmail: string | undefined;
            let claimedName: string | undefined;
            let claimedPicture: string | undefined;

            if (idToken) {
              const { payload } = await jwtVerify(idToken, iamJwks, {
                issuer: `${IAM_URL}/api/auth`,
                audience: "portfolio",
                clockTolerance: 60,
              });
              userId = (payload.sub as string) ?? (payload.userId as string);
              claimedEmail = payload.email as string | undefined;
              claimedName = payload.name as string | undefined;
              claimedPicture = payload.picture as string | undefined;
            } else {
              userId = "";
            }

            const resp = await fetch(
              `${IAM_URL}/api/auth/oauth2/userinfo`,
              {
                headers: { Authorization: `Bearer ${tokens.accessToken}` },
              },
            );
            const data = await resp.json();

            if (!userId) {
              userId = data.sub ?? data.userId;
            }

            return {
              id: userId,
              email: claimedEmail ?? (data.email as string),
              name: claimedName ?? (data.name as string),
              image:
                claimedPicture ?? (data.picture as string | undefined) ?? undefined,
              emailVerified: true,
            };
          },
        },
      ],
    }),
    nextCookies(),
  ],
});
