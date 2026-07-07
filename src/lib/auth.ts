import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import {
  admin as adminPlugin,
  genericOAuth,
  twoFactor,
} from "better-auth/plugins";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { prisma } from "@/db";
import { ac, adminRole, employeeRole, superadminRole } from "./permission";

const iamJwks = createRemoteJWKSet(
  new URL(`${process.env.IAM_URL}/api/auth/jwks`),
);

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
    genericOAuth({
      config: [
        {
          providerId: "portfolio",
          discoveryUrl: `${process.env.IAM_URL}/.well-known/openid-configuration`,
          clientId: "portfolio",
          clientSecret: process.env.OAUTH_CLIENT_SECRET ?? "",
          scopes: ["openid", "profile", "email"],
          pkce: true,
          getUserInfo: async (tokens) => {
            const idToken = tokens.raw?.id_token as string | undefined;

            let userId: string;
            let claimedEmail: string | undefined;
            let claimedName: string | undefined;
            let claimedPicture: string | undefined;

            if (idToken) {
              const { payload } = await jwtVerify(idToken, iamJwks, {
                issuer: `${process.env.IAM_URL}/api/auth`,
                audience: "portfolio",
                algorithms: ["RS256"],
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
              `${process.env.IAM_URL}/api/auth/oauth2/userinfo`,
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
