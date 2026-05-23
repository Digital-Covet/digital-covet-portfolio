"use server";

import { cookies } from "next/headers";

const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export async function setSidebarCookie(openState: boolean) {
  const cookieStore = await cookies();
  cookieStore.set(SIDEBAR_COOKIE_NAME, String(openState), {
    path: "/",
    maxAge: SIDEBAR_COOKIE_MAX_AGE,
  });
}
