import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";

const handlers = toNextJsHandler(auth);

export async function GET(req: Request) {
  const url = new URL(req.url);

  if (url.pathname.includes("/callback/portfolio")) {
    logger.info("OAuth2 callback received", {
      hasCode: !!url.searchParams.get("code"),
      error: url.searchParams.get("error"),
      errorDescription: url.searchParams.get("error_description"),
    });
  }

  try {
    const response = await handlers.GET(req);

    if (url.pathname.includes("/callback/portfolio")) {
      logger.info("OAuth2 callback response", {
        status: response.status,
        location: response.headers.get("Location"),
      });

      if (!response.ok) {
        const body = await response.clone().text();
        logger.error("OAuth2 callback failed", {
          status: response.status,
          body: body.substring(0, 500),
        });
      }
    }

    return response;
  } catch (error) {
    logger.error("Auth GET handler error", {
      error: error instanceof Error ? error.message : String(error),
      pathname: url.pathname,
    });
    throw error;
  }
}

export async function POST(req: Request) {
  const url = new URL(req.url);

  if (url.pathname.includes("/sign-in/oauth2")) {
    logger.info("OAuth2 sign-in request", { pathname: url.pathname });
  }

  try {
    const response = await handlers.POST(req);

    if (url.pathname.includes("/sign-in/oauth2")) {
      logger.info("OAuth2 sign-in response", {
        status: response.status,
        ok: response.ok,
      });

      if (!response.ok) {
        const body = await response.clone().text();
        logger.error("OAuth2 sign-in failed", {
          status: response.status,
          body: body.substring(0, 500),
        });
      }
    }

    return response;
  } catch (error) {
    logger.error("Auth POST handler error", {
      error: error instanceof Error ? error.message : String(error),
      pathname: url.pathname,
    });
    throw error;
  }
}
