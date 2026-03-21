import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  deleteProductImageByUrl,
  saveProductImageFile,
  isStoredProductImage,
} from "@/lib/product-image";

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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return denied;

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  }

  const ct = request.headers.get("content-type") ?? "";
  const data: Record<string, unknown> = {};

  if (ct.includes("multipart/form-data")) {
    let fd: FormData;
    try {
      fd = await request.formData();
    } catch {
      return NextResponse.json({ error: "Formulário inválido." }, { status: 400 });
    }

    const nameEntry = fd.get("name");
    if (typeof nameEntry === "string") {
      const name = nameEntry.trim();
      if (!name || name.length > 120) {
        return NextResponse.json({ error: "Nome inválido." }, { status: 400 });
      }
      data.name = name;
    }
    if (fd.has("price")) {
      const price = parseFloatSafe(fd.get("price"));
      if (price === null || price < 0) {
        return NextResponse.json({ error: "Preço inválido." }, { status: 400 });
      }
      data.price = price;
    }
    if (fd.has("dailyYield")) {
      const dailyYield = parseFloatSafe(fd.get("dailyYield"));
      if (dailyYield === null || dailyYield < 0) {
        return NextResponse.json({ error: "Rendimento diário inválido." }, { status: 400 });
      }
      data.dailyYield = dailyYield;
    }
    if (fd.has("totalReturn")) {
      const totalReturn = parseFloatSafe(fd.get("totalReturn"));
      if (totalReturn === null || totalReturn < 0) {
        return NextResponse.json({ error: "Retorno total inválido." }, { status: 400 });
      }
      data.totalReturn = totalReturn;
    }
    if (fd.has("cycleDays")) {
      const raw = fd.get("cycleDays");
      let cycleDays = 0;
      if (typeof raw === "string") cycleDays = parseInt(raw, 10) || 0;
      else if (typeof raw === "number" && Number.isInteger(raw)) cycleDays = raw;
      if (cycleDays < 1) {
        return NextResponse.json({ error: "Ciclo inválido." }, { status: 400 });
      }
      data.cycleDays = cycleDays;
    }
    if (fd.has("isActive")) {
      data.isActive = fd.get("isActive") !== "false" && fd.get("isActive") !== "0";
    }

    const image = fd.get("image");
    const imageFile = image instanceof File && image.size > 0 ? image : null;
    if (imageFile) {
      try {
        if (isStoredProductImage(existing.imageUrl)) {
          await deleteProductImageByUrl(existing.imageUrl);
        }
        data.imageUrl = await saveProductImageFile(id, imageFile);
      } catch (imgErr) {
        const msg =
          imgErr instanceof Error ? imgErr.message : "Erro ao salvar imagem.";
        return NextResponse.json({ error: msg }, { status: 400 });
      }
    }
  } else {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
    }
    const b = (body ?? {}) as Record<string, unknown>;
    if (typeof b.name === "string") {
      const name = b.name.trim();
      if (!name || name.length > 120) {
        return NextResponse.json({ error: "Nome inválido." }, { status: 400 });
      }
      data.name = name;
    }
    if (typeof b.imageUrl === "string") {
      data.imageUrl = b.imageUrl.trim().slice(0, 2000);
    }
    if (b.price !== undefined) {
      const price = parseFloatSafe(b.price);
      if (price === null || price < 0) {
        return NextResponse.json({ error: "Preço inválido." }, { status: 400 });
      }
      data.price = price;
    }
    if (b.dailyYield !== undefined) {
      const dailyYield = parseFloatSafe(b.dailyYield);
      if (dailyYield === null || dailyYield < 0) {
        return NextResponse.json({ error: "Rendimento diário inválido." }, { status: 400 });
      }
      data.dailyYield = dailyYield;
    }
    if (b.totalReturn !== undefined) {
      const totalReturn = parseFloatSafe(b.totalReturn);
      if (totalReturn === null || totalReturn < 0) {
        return NextResponse.json({ error: "Retorno total inválido." }, { status: 400 });
      }
      data.totalReturn = totalReturn;
    }
    if (b.cycleDays !== undefined) {
      let cycleDays = 0;
      if (typeof b.cycleDays === "number" && Number.isInteger(b.cycleDays)) {
        cycleDays = b.cycleDays;
      } else if (typeof b.cycleDays === "string") {
        cycleDays = parseInt(b.cycleDays, 10) || 0;
      }
      if (cycleDays < 1) {
        return NextResponse.json({ error: "Ciclo inválido." }, { status: 400 });
      }
      data.cycleDays = cycleDays;
    }
    if (typeof b.isActive === "boolean") {
      data.isActive = b.isActive;
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nenhuma alteração." }, { status: 400 });
  }

  try {
    await prisma.product.update({ where: { id }, data });
  } catch (e) {
    console.error("PATCH product:", e);
    return NextResponse.json({ error: "Erro ao atualizar." }, { status: 500 });
  }

  const fresh = await prisma.product.findUnique({ where: { id } });
  return NextResponse.json({
    success: true,
    message: "Produto atualizado.",
    imageUrl: fresh?.imageUrl ?? "",
  });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return denied;

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  }

  try {
    await prisma.product.delete({ where: { id } });
    if (isStoredProductImage(existing.imageUrl)) {
      await deleteProductImageByUrl(existing.imageUrl);
    }
  } catch (e) {
    console.error("DELETE product:", e);
    return NextResponse.json({ error: "Erro ao excluir." }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Produto excluído." });
}
