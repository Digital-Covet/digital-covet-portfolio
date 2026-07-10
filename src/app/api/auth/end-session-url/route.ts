import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/db";
import { auth } from "@/lib/auth";
import { APP_DOMAIN, ROUTES } from "@/lib/constants";

const IAM_URL = (process.env.IAM_URL ?? "").replace(/\/+$/, "");

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ url: null }, { status: 401 });
    }

    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        providerId: "portfolio",
      },
    });

    const idToken = account?.idToken;
    if (!idToken || !IAM_URL) {
      return NextResponse.json({ url: null });
    }

    const endSessionUrl = new URL(`${IAM_URL}/api/auth/oauth2/end-session`);
    endSessionUrl.searchParams.set("id_token_hint", idToken);
    endSessionUrl.searchParams.set(
      "post_logout_redirect_uri",
      `${APP_DOMAIN}${ROUTES.LOGIN}`,
    );

    return NextResponse.json({ url: endSessionUrl.toString() });
  } catch (error) {
    console.error("[end-session-url] Failed to build end-session URL:", error);
    return NextResponse.json({ url: null });
  }
}
