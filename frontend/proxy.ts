import { type NextRequest, NextResponse } from "next/server";
import { getAuthUser, isGuestUser } from "@/lib/auth/session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  if (pathname.startsWith("/api/auth/cookie")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/auth/signup_wallet")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/companies/list")) {
    return NextResponse.next();
  }

  const authUrl =
    process.env.NEXTAUTH_URL ||
    "https://ulejra-ai-frontend-384014006015.europe-west1.run.app";

  const isApiPath = pathname.startsWith("/api/");
  const isChatPath = pathname.startsWith("/chat/");
  const isLoginOrRegister = pathname === "/login" || pathname === "/register";
  const isChatApi = pathname.startsWith("/api/chat");
  const isChatPage = pathname.startsWith("/chat/");

  if (isChatApi || isChatPage) {
    return NextResponse.next();
  }

  if (isApiPath || isChatPath) {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.redirect(new URL("/", authUrl));
    }

    if (isGuestUser(user)) {
      return NextResponse.redirect(new URL("/", authUrl));
    }
  }

  if (isLoginOrRegister) {
    const user = await getAuthUser();

    if (user && !isGuestUser(user)) {
      return NextResponse.redirect(new URL("/", authUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
    "/chat/:id",
    "/login",
    "/register",
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
