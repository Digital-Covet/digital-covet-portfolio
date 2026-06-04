import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin as adminPlugin, emailOTP, twoFactor } from "better-auth/plugins";
import { prisma } from "@/db";
import { sendEmail } from "@/services/email";
import { renderDeleteVerificationEmail } from "@/services/email-templates";
import { ac, adminRole, employeeRole, superadminRole } from "./permission";

export const auth = betterAuth({
  trustedOrigins: ["https://portfolio.digitalcovet.com", "http://localhost:3000"],
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
  ],
});
