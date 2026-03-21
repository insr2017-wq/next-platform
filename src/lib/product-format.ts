import type { Product } from "@/components/products/ProductCard";

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatProductForCard(p: {
  id: string;
  name: string;
  imageUrl?: string | null;
  price: number;
  dailyYield: number;
  cycleDays: number;
  totalReturn: number;
}): Product {
  return {
    id: p.id,
    name: p.name,
    imageUrl: p.imageUrl?.trim() || undefined,
    price: brl.format(p.price),
    dailyIncome: brl.format(p.dailyYield),
    cycle: `${p.cycleDays} ${p.cycleDays === 1 ? "dia" : "dias"}`,
    total: brl.format(p.totalReturn),
  };
}
