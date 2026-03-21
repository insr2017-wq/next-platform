import { prisma } from "@/lib/db";
import { AdminProductsManager, type ProductRow } from "@/components/admin/AdminProductsManager";

export default async function AdminProductsPage() {
  let rows: ProductRow[] = [];
  try {
    const list = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });
    rows = list.map((p) => ({
      id: p.id,
      name: p.name,
      imageUrl: p.imageUrl ?? "",
      price: Number(p.price),
      dailyYield: Number(p.dailyYield),
      cycleDays: p.cycleDays,
      totalReturn: Number(p.totalReturn),
      isActive: p.isActive,
      createdAt: p.createdAt.toISOString(),
    }));
  } catch {
    rows = [];
  }

  return <AdminProductsManager initialRows={rows} />;
}
