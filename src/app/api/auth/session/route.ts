import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ session: null });
  }
  return NextResponse.json({
    session: {
      userId: session.userId,
      role: session.role,
      phone: session.phone,
    },
  });
}
