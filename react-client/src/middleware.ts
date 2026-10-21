import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isTokenExpired } from "@/lib/jwt";

/**
 * Next.js Edge Middleware for route protection.
 * Runs on the server before client pages render.
 */
export function middleware(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;
  const { pathname } = request.nextUrl;
  const expired = isTokenExpired(token);

  // 1. Protected Routes: redirect unauthenticated or expired users to /login
  if (pathname.startsWith("/dashboard")) {
    if (!token || expired) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      if (token && expired) {
        loginUrl.searchParams.set("reason", "expired");
      }
      const response = NextResponse.redirect(loginUrl);
      // Immediately remove expired cookies
      response.cookies.delete("access_token");
      response.cookies.delete("user_data");
      return response;
    }
  }

  // 2. Auth Routes: /login
  if (pathname === "/login") {
    const hasForceOrReason =
      request.nextUrl.searchParams.has("reason") ||
      request.nextUrl.searchParams.has("force");

    if (hasForceOrReason || expired) {
      const response = NextResponse.next();
      response.cookies.delete("access_token");
      response.cookies.delete("user_data");
      return response;
    }

    if (token && !expired) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // 3. For all other routes, purge expired tokens if present
  if (token && expired) {
    const response = NextResponse.next();
    response.cookies.delete("access_token");
    response.cookies.delete("user_data");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
