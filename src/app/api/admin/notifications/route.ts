import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { phoneLookupVariants } from "@/lib/phone-auth";
import { formatDateTimeBr } from "@/lib/datetime-br";

function requireAdmin(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }
  return null;
}

export async function GET() {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return denied;

  const rows = await prisma.userNotification.findMany({
    orderBy: { createdAt: "desc" },
    take: 80,
    include: { user: { select: { fullName: true, phone: true, publicId: true } } },
  });

  return NextResponse.json({
    items: rows.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      category: n.category,
      code: n.code,
      createdAt: formatDateTimeBr(n.createdAt),
      target:
        n.userId == null
          ? "Todos os usuários"
          : `${n.user?.fullName || "Usuário"} (${n.user?.publicId || n.user?.phone || n.userId})`,
    })),
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const b = (body ?? {}) as {
    title?: string;
    body?: string;
    code?: string;
    mode?: string;
    target?: string;
  };

  const title = typeof b.title === "string" ? b.title.trim() : "";
  const text = typeof b.body === "string" ? b.body.trim() : "";
  const code = typeof b.code === "string" ? b.code.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "Informe o título da notificação." }, { status: 400 });
  }

  const mode = b.mode === "user" ? "user" : "all";
  if (mode === "all") {
    await prisma.userNotification.create({
      data: {
        userId: null,
        title,
        body: text,
        category: "general",
        code: code || null,
      },
    });
    return NextResponse.json({ success: true, message: "Notificação enviada para todos os usuários." });
  }

  const target = typeof b.target === "string" ? b.target.trim() : "";
  if (!target) {
    return NextResponse.json({ error: "Informe o telefone ou ID do usuário." }, { status: 400 });
  }

  const phoneVariants = phoneLookupVariants(target.replace(/\D/g, ""));
  const user = await prisma.user.findFirst({
    where: {
      role: "user",
      OR: [
        { publicId: target },
        ...(phoneVariants.length > 0 ? [{ phone: { in: phoneVariants } }] : []),
      ],
    },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  await prisma.userNotification.create({
    data: {
      userId: user.id,
      title,
      body: text,
      category: "individual",
      code: code || null,
    },
  });

  return NextResponse.json({ success: true, message: "Notificação enviada ao usuário." });
}
