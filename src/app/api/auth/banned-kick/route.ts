import { NextResponse } from "next/server";

const COOKIE_NAME = "session";

export async function GET(request: Request) {
  const url = new URL("/login?motivo=suspensa", request.url);
  const res = NextResponse.redirect(url);
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
  return res;
}
