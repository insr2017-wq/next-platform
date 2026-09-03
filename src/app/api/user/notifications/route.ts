import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateTimeBr } from "@/lib/datetime-br";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "user") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const rows = await prisma.userNotification.findMany({
    where: {
      OR: [{ userId: session.userId }, { userId: null }],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    items: rows.map((n) => ({
      id: n.id,
      category: n.category === "individual" ? "individual" : "general",
      title: n.title,
      text: n.body || undefined,
      code: n.code || undefined,
      time: formatDateTimeBr(n.createdAt),
      read: false,
    })),
  });
}
