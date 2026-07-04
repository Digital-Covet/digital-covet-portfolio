import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import {
  admin as adminPlugin,
  emailOTP,
  genericOAuth,
  jwt,
  twoFactor,
} from "better-auth/plugins";
import { prisma } from "@/db";
import { sendEmail } from "@/services/email";
import { renderDeleteVerificationEmail } from "@/services/email-templates";
import { ac, adminRole, employeeRole, superadminRole } from "./permission";

export const auth = betterAuth({
  trustedOrigins: [
    "https://iam.digitalcovet.com",
    "https://portfolio.digitalcovet.com",
    "http://localhost:3000",
  ],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }, _request) => {
      try {
        await sendEmail({
          to: user.email,
          subject: "Reset your password",
          text: `Click the link to reset your password: ${url}`,
        });
      } catch (error) {
        console.error(
          "[Auth Hook] Failed to send reset password email:",
          error instanceof Error ? error.message : error,
        );
        throw new Error("Failed to send reset password email.");
      }
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    sendVerificationEmail: async ({ user, url }, _request) => {
      try {
        await sendEmail({
          to: user.email,
          subject: "Verify your email address",
          text: `Click the link to verify your email: ${url}`,
        });
      } catch (error) {
        console.error(
          "[Auth Hook] Failed to send verification email:",
          error instanceof Error ? error.message : error,
        );
        throw new Error("Failed to send verification email.");
      }
    },
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
    },
  },
  plugins: [
    jwt({
      jwks: {
        keyPairConfig: {
          alg: "RS256",
        },
        rotationInterval: 60 * 60 * 24 * 30, // 30 days
        gracePeriod: 60 * 60 * 24 * 30, // 30 days
      },
      jwt: {
        issuer: process.env.BETTER_AUTH_URL,
        audience: process.env.BETTER_AUTH_URL,
        expirationTime: "15m",
      },
    }),
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
          discoveryUrl:
            "https://iam.digitalcovet.com/.well-known/openid-configuration",
          clientId: "portfolio",
          clientSecret: process.env.OAUTH_CLIENT_SECRET ?? "",
          scopes: ["openid", "profile", "email"],
          getUserInfo: async (tokens) => {
            const resp = await fetch("https://iam.digitalcovet.com/userinfo", {
              headers: { Authorization: `Bearer ${tokens.accessToken}` },
            });
            const data = await resp.json();

            const idToken = tokens.raw?.id_token as string | undefined;
            let userId: string;

            if (idToken) {
              const payload = JSON.parse(
                Buffer.from(idToken.split(".")[1], "base64url").toString(),
              );
              userId = payload.sub ?? payload.userId;
            } else {
              userId = data.sub ?? data.userId;
            }

            return {
              id: userId,
              email: data.email as string,
              name: data.name as string,
              image: (data.picture as string | undefined) ?? null,
              emailVerified: true,
            };
          },
        },
      ],
    }),
  ],
});
