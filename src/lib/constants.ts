export const APP_DOMAIN =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
export const WORK_EMAIL_DOMAIN = "@digitalcovet.com";
export const SUPPORT_EMAIL = "support@digitalcovet.com";
export const COMPANY_NAME = "Digital Covet";
export const INVITATION_EXPIRY_DAYS = 7;

export const ROUTES = {
  LOGIN: "/auth/login",
  FORGOT_PASSWORD: "/auth/forgot-password",
  RESET_PASSWORD: "/auth/reset-password",
  SETUP_PASSWORD: "/auth/setup-password",
  SETUP_2FA: "/auth/setup-2fa",
  VERIFY_2FA: "/auth/verify-2fa",
  DASHBOARD: "/dashboard",
  TEST_INVITE: "/test-invite",
  SHARES: "/shares",
} as const;

export const ROLES = {
  EMPLOYEE: "employee",
  ADMIN: "admin",
  SUPERADMIN: "superadmin",
} as const;

export function buildInviteUrl(token: string): string {
  return `${APP_DOMAIN}${ROUTES.SETUP_PASSWORD}?token=${token}`;
}

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
