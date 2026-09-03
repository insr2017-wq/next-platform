import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyTokenEdge } from "@/lib/auth-edge";
import {
  CANONICAL_SITE_HOST,
  isAllowedBrowserOrigin,
  isWebhookPath,
  isWwwSiteHost,
} from "@/lib/site-origin";

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

function requestHostname(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-host");
  const host = (forwarded?.split(",")[0] || request.headers.get("host") || "").trim();
  return host.split(":")[0]?.toLowerCase() ?? "";
}

function redirectWwwToApex(request: NextRequest): NextResponse {
  const dest = new URL(request.url);
  dest.hostname = CANONICAL_SITE_HOST;
  dest.protocol = "https:";
  dest.port = "";
  return NextResponse.redirect(dest, 308);
}

function applyCors(request: NextRequest, response: NextResponse): NextResponse {
  const origin = request.headers.get("origin");
  if (isAllowedBrowserOrigin(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    response.headers.append("Vary", "Origin");
  }
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = requestHostname(request);
  const isApiOrWebhook = pathname.startsWith("/api") || pathname.startsWith("/webhooks");

  // www → raiz nos acessos de página/API do app. Webhooks de gateway aceitam os dois hosts
  // (provedores de pagamento nem sempre seguem redirect em POST).
  if (isWwwSiteHost(hostname) && !isWebhookPath(pathname)) {
    return redirectWwwToApex(request);
  }

  if (isApiOrWebhook) {
    if (request.method === "OPTIONS") {
      return applyCors(request, new NextResponse(null, { status: 204 }));
    }
    return applyCors(request, NextResponse.next());
  }

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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$).*)",
  ],
};
