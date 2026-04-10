import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // If we are at the login page, let it pass
  if (request.nextUrl.pathname.startsWith("/dapur/login")) {
    const authCookie = request.cookies.get("admin_session");
    // if already authenticated and trying to go to login, redirect to dapur
    if (authCookie && authCookie.value === "authenticated") {
      return NextResponse.redirect(new URL("/dapur", request.url));
    }
    return NextResponse.next();
  }

  // Check if trying to access protected paths
  if (!isProtectedPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get("admin_session");

  if (!authCookie || authCookie.value !== "authenticated") {
    // Return unauthorized for API calls instead of redirect
    if (request.nextUrl.pathname.startsWith("/api/dapur")) {
      return new NextResponse(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Redirect to login page for browser navigation
    const loginUrl = new URL("/dapur/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

function isProtectedPath(pathname: string): boolean {
  return pathname.startsWith("/dapur") || pathname.startsWith("/api/dapur");
}

export const config = {
  matcher: ["/dapur/:path*", "/api/dapur/:path*"]
};
