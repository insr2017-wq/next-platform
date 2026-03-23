import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyTokenEdge } from "@/lib/auth-edge";

const SESSION_COOKIE = "session";

const USER_ROUTES = [
  "/home",
  "/profile",
  "/invite",
  "/deposit",
  "/withdraw",
  "/history",
  "/my-products",
  "/comprar",
  "/check-in",
  "/bonus-code",
  "/deposit-history",
  "/withdraw-history",
  "/dashboard",
];

const ADMIN_PREFIX = "/admin";
const AUTH_ROUTES = ["/login", "/register"];

function isUserRoute(pathname: string): boolean {
  return USER_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

function isAdminRoute(pathname: string): boolean {
  return pathname === ADMIN_PREFIX || pathname.startsWith(ADMIN_PREFIX + "/");
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(SESSION_COOKIE)?.value;

  let session: { role: "user" | "admin" } | null = null;
  if (token) {
    session = await verifyTokenEdge(token);
  }

  // Root: let the root page handle redirect (server-side session check)
  if (pathname === "/") {
    return NextResponse.next();
  }

  // Auth pages: if logged in, redirect by role
  if (isAuthRoute(pathname)) {
    if (session) {
      const redirectUrl =
        session.role === "admin" ? "/admin/dashboard" : "/home";
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
    return NextResponse.next();
  }

  // Admin routes: require admin
  if (isAdminRoute(pathname)) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (session.role !== "admin") {
      return NextResponse.redirect(new URL("/home", request.url));
    }
    return NextResponse.next();
  }

  // User app routes: require any logged-in user
  if (isUserRoute(pathname)) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/home",
    "/home/:path*",
    "/profile",
    "/profile/:path*",
    "/invite",
    "/invite/:path*",
    "/deposit",
    "/withdraw",
    "/history",
    "/my-products",
    "/comprar",
    "/comprar/:path*",
    "/check-in",
    "/bonus-code",
    "/deposit-history",
    "/withdraw-history",
    "/dashboard",
    "/dashboard/:path*",
    "/admin",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
