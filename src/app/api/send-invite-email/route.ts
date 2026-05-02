import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { sendEmail } from "@/services/email";

interface SendInviteEmailBody {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (
    session.user.role !== ROLES.ADMIN &&
    session.user.role !== ROLES.SUPERADMIN
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body: SendInviteEmailBody = await request.json();
    if (!body.to || !body.subject || !body.text) {
      return NextResponse.json(
        { error: "Missing required fields (to, subject, or text)" },
        { status: 400 },
      );
    }

    await sendEmail({
      to: body.to,
      subject: body.subject,
      text: body.text,
      html: body.html,
    });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    console.error("[POST /api/send-invite-email] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
