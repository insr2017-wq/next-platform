import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import {
  ensureUserBannedColumnSqlite,
  ensureUserPublicIdColumnAndBackfill,
  ensureUserPixColumnsSqlite,
  ensureUserCheckInColumnsSqlite,
  ensureUserSponsoredUserColumnSqlite,
} from "@/lib/user-schema-sqlite";
import { AdminUserManagementClient } from "@/components/admin/AdminUserManagementClient";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminUserManagementPage({ params }: PageProps) {
  const { id } = await params;
  if (!id) notFound();

  try {
    await ensureUserBannedColumnSqlite();
    await ensureUserPublicIdColumnAndBackfill();
    await ensureUserPixColumnsSqlite();
    await ensureUserCheckInColumnsSqlite();
    await ensureUserSponsoredUserColumnSqlite();
  } catch {
    notFound();
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      publicId: true,
      phone: true,
      role: true,
      banned: true,
      balance: true,
      createdAt: true,
      pixKeyType: true,
      pixKey: true,
    },
  });
  if (!user) notFound();

  const [deposits, userProducts, products] = await Promise.all([
    prisma.deposit.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.userProduct.findMany({
      where: { userId: id },
      orderBy: { purchasedAt: "desc" },
      select: {
        id: true,
        productId: true,
        purchasedAt: true,
        earningStatus: true,
        product: { select: { name: true } },
      },
    }),
    prisma.product.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const initialData = {
    user: {
      id: user.id,
      publicId: user.publicId ?? "",
      phone: user.phone ?? "",
      role: user.role ?? "user",
      banned: Boolean(user.banned),
      // Mantém a página estável caso `sponsoredUser` ainda não esteja alinhado
      // no Prisma Client/DB. O toggle pode ser reintroduzido após o carregamento.
      sponsoredUser: false,
      balance: Number(user.balance ?? 0),
      createdAt: user.createdAt.toISOString(),
      pixKeyType: user.pixKeyType ?? "",
      pixKey: user.pixKey ?? "",
    },
    deposits: deposits.map((d) => ({
      id: d.id,
      amount: Number(d.amount),
      status: d.status,
      createdAt: d.createdAt.toISOString(),
    })),
    userProducts: userProducts.map((up) => ({
      id: up.id,
      productId: up.productId,
      productName: up.product.name,
      purchasedAt: up.purchasedAt.toISOString(),
      earningStatus: up.earningStatus ?? "active",
    })),
    products: products.map((p) => ({ id: p.id, name: p.name })),
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Link
          href="/admin/users"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 14,
            fontWeight: 700,
            color: "var(--brand)",
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={18} />
          Voltar para Usuários
        </Link>
      </div>
      <AdminUserManagementClient initialData={initialData} />
    </div>
  );
}
