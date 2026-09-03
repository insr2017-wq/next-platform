import { prisma } from "@/lib/db";
import { ensureDefaultRoulettePrizes } from "@/lib/roulette";
import { AdminRouletteManager, type RoulettePrizeRow } from "@/components/admin/AdminRouletteManager";

export default async function AdminRoulettePage() {
  let rows: RoulettePrizeRow[] = [];
  try {
    await ensureDefaultRoulettePrizes();
    const list = await prisma.roulettePrize.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    const sum = list.filter((r) => r.active).reduce((s, r) => s + r.probability, 0);
    rows = list.map((r) => ({
      id: r.id,
      label: r.label,
      value: Number(r.value),
      kind: r.kind,
      probability: r.probability,
      active: r.active,
      chancePercent: r.active && sum > 0 ? Math.round((r.probability / sum) * 10000) / 100 : 0,
    }));
  } catch {
    rows = [];
  }

  return (
    <div>
      <p style={{ margin: "0 0 16px", color: "#6b7280", fontSize: 14 }}>
        O sorteio é feito no servidor, com peso relativo. A chance real é peso ÷ soma dos pesos ativos.
        O usuário pode girar 1 vez por dia (America/São Paulo), mais giros extra de missões.
      </p>
      <AdminRouletteManager initialRows={rows} />
    </div>
  );
}
