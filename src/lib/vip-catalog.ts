import { formatDateBr } from "@/lib/datetime-br";

export type CatalogProduct = {
  id: string;
  code: string;
  price: number;
  daily: number;
  total: number;
  cycleDays: number;
  imageUrl?: string;
  imageKey: "n004" | "n005";
  featured: boolean;
  locked: boolean;
};

export type UserOrder = {
  id: string;
  code: string;
  price: number;
  daily: number;
  total: number;
  cycleDays: number;
  validade: string;
  purchasedDate: string;
  purchasedTime: string;
  imageKey: "n004" | "n005";
  imageUrl?: string;
  status: "active" | "finished";
};

export function mapProductsToCatalog(
  products: Array<{
    id: string;
    name: string;
    price: number;
    dailyYield: number;
    totalReturn: number;
    cycleDays: number;
    imageUrl?: string | null;
    featured?: boolean | null;
    purchaseLocked?: boolean | null;
  }>,
): CatalogProduct[] {
  return products.map((p, i) => ({
    id: p.id,
    code: p.name.trim() || `PROD-${i + 1}`,
    price: Number(p.price),
    daily: Number(p.dailyYield),
    total: Number(p.totalReturn),
    cycleDays: Math.max(1, p.cycleDays),
    imageUrl: p.imageUrl?.trim() || undefined,
    imageKey: i % 2 === 0 ? "n004" : "n005",
    featured: Boolean(p.featured),
    locked: Boolean(p.purchaseLocked),
  }));
}

export function mapUserProductsToOrders(
  rows: Array<{
    id: string;
    purchasedAt: Date;
    daysPaid: number;
    cycleDaysSnapshot: number;
    dailyYieldSnapshot: number;
    earningStatus: string;
    product: {
      name: string;
      price: number;
      dailyYield: number;
      totalReturn: number;
      cycleDays: number;
      imageUrl?: string | null;
    };
  }>,
): UserOrder[] {
  return rows.map((row, i) => {
    const cycle =
      row.cycleDaysSnapshot >= 1 ? row.cycleDaysSnapshot : Math.max(1, row.product.cycleDays);
    const daily =
      row.dailyYieldSnapshot > 0 ? row.dailyYieldSnapshot : Number(row.product.dailyYield);
    const end = new Date(row.purchasedAt.getTime() + cycle * 864e5);
    const active = row.earningStatus === "active" && row.daysPaid < cycle;
    const purchased = new Date(row.purchasedAt);
    return {
      id: row.id,
      code: row.product.name.trim() || "Produto",
      price: Number(row.product.price),
      daily,
      total: Number(row.product.totalReturn),
      cycleDays: cycle,
      validade: formatDateBr(end),
      purchasedDate: formatDateBr(purchased),
      purchasedTime: purchased.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      imageUrl: row.product.imageUrl?.trim() || undefined,
      imageKey: i % 2 === 0 ? "n004" : "n005",
      status: active ? "active" : "finished",
    };
  });
}
