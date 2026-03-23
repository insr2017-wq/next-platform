import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { generateInviteCode } from "@/lib/invite-code";

const PHONE = "48999997766";
const PASSWORD = "12345678";

async function uniqueInviteCode(): Promise<string> {
  for (let i = 0; i < 40; i++) {
    const code = generateInviteCode();
    const taken = await prisma.user.findUnique({ where: { inviteCode: code } });
    if (!taken) return code;
  }
  throw new Error("invite");
}

export async function GET() {
  const passwordHash = await hashPassword(PASSWORD);
  const existing = await prisma.user.findUnique({ where: { phone: PHONE } });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: "admin", passwordHash },
    });
  } else {
    const inviteCode = await uniqueInviteCode();
    await prisma.user.create({
      data: {
        fullName: "Admin",
        phone: PHONE,
        passwordHash,
        role: "admin",
        balance: 0,
        inviteCode,
      },
    });
  }

  return new NextResponse("OK", { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
