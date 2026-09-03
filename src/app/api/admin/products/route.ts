import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { saveProductImageFile } from "@/lib/product-image";
import { devErrorDetail, logDevApiError } from "@/lib/dev-api-error";

function requireAdmin(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }
  return null;
}

function parseFloatSafe(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = parseFloat(v.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function parseProductFields(fd: FormData) {
  const nameEntry = fd.get("name");
  const name = typeof nameEntry === "string" ? nameEntry.trim() : "";
  const price = parseFloatSafe(fd.get("price"));
  const dailyYield = parseFloatSafe(fd.get("dailyYield"));
  const totalReturn = parseFloatSafe(fd.get("totalReturn"));
  let cycleDays = 0;
  const cd = fd.get("cycleDays");
  if (typeof cd === "string") {
    const n = parseInt(cd, 10);
    if (Number.isFinite(n) && n > 0) cycleDays = n;
  } else if (typeof cd === "number" && Number.isInteger(cd) && cd > 0) {
    cycleDays = cd;
  }
  const isActive = fd.get("isActive") !== "false" && fd.get("isActive") !== "0";
  return { name, price, dailyYield, totalReturn, cycleDays, isActive };
}

function parseJsonProductBody(b: Record<string, unknown>) {
  const name = typeof b.name === "string" ? b.name.trim() : "";
  const price = parseFloatSafe(b.price);
  const dailyYield = parseFloatSafe(b.dailyYield);
  const totalReturn = parseFloatSafe(b.totalReturn);
  let cycleDays = 0;
  if (typeof b.cycleDays === "number" && Number.isInteger(b.cycleDays) && b.cycleDays > 0) {
    cycleDays = b.cycleDays;
  } else if (typeof b.cycleDays === "string") {
    const n = parseInt(b.cycleDays, 10);
    if (Number.isFinite(n) && n > 0) cycleDays = n;
  }
  const isActive = b.isActive !== false;
  return { name, price, dailyYield, totalReturn, cycleDays, isActive };
}

export async function POST(request: Request) {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return denied;

  const ct = request.headers.get("content-type") ?? "";
  let name: string;
  let price: number | null;
  let dailyYield: number | null;
  let totalReturn: number | null;
  let cycleDays: number;
  let isActive: boolean;
  let imageFile: File | null = null;

  if (ct.includes("application/json")) {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
    }
    const parsed = parseJsonProductBody((body ?? {}) as Record<string, unknown>);
    name = parsed.name;
    price = parsed.price;
    dailyYield = parsed.dailyYield;
    totalReturn = parsed.totalReturn;
    cycleDays = parsed.cycleDays;
    isActive = parsed.isActive;
  } else if (ct.includes("multipart/form-data")) {
    let fd: FormData;
    try {
      fd = await request.formData();
    } catch {
      return NextResponse.json({ error: "Formulário inválido." }, { status: 400 });
    }
    const parsed = parseProductFields(fd);
    name = parsed.name;
    price = parsed.price;
    dailyYield = parsed.dailyYield;
    totalReturn = parsed.totalReturn;
    cycleDays = parsed.cycleDays;
    isActive = parsed.isActive;
    const image = fd.get("image");
    imageFile = image instanceof File && image.size > 0 ? image : null;
  } else {
    return NextResponse.json(
      {
        error:
          "Use JSON (sem imagem) ou multipart/form-data. Envie Content-Type correto.",
      },
      { status: 400 }
    );
  }
  if (!name || name.length > 120) {
    return NextResponse.json({ error: "Informe um nome válido." }, { status: 400 });
  }
  if (price === null || price < 0 || dailyYield === null || dailyYield < 0) {
    return NextResponse.json({ error: "Preço e rendimento diário inválidos." }, { status: 400 });
  }
  if (totalReturn === null || totalReturn < 0) {
    return NextResponse.json({ error: "Retorno total inválido." }, { status: 400 });
  }
  if (cycleDays < 1) {
    return NextResponse.json({ error: "Ciclo deve ser pelo menos 1 dia." }, { status: 400 });
  }

  try {
    const p = await prisma.product.create({
      data: {
        name,
        imageUrl: "",
        price,
        dailyYield,
        cycleDays,
        totalReturn,
        isActive,
      },
    });
    if (imageFile) {
      try {
        const imageUrl = await saveProductImageFile(p.id, imageFile);
        await prisma.product.update({
          where: { id: p.id },
          data: { imageUrl },
        });
      } catch (imgErr) {
        await prisma.product.delete({ where: { id: p.id } }).catch(() => {});
        const msg =
          imgErr instanceof Error ? imgErr.message : "Erro ao salvar imagem.";
        return NextResponse.json({ error: msg }, { status: 400 });
      }
    }
    const updated = await prisma.product.findUnique({ where: { id: p.id } });
    return NextResponse.json({
      success: true,
      message: "Produto criado.",
      id: p.id,
      imageUrl: updated?.imageUrl ?? "",
    });
  } catch (e) {
    logDevApiError("admin/products POST", e);
    return NextResponse.json(
      {
        error: "Erro ao criar produto.",
        ...(devErrorDetail(e) ? { detalhe: devErrorDetail(e) } : {}),
      },
      { status: 500 }
    );
  }
}
