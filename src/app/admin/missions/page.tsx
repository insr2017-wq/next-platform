import { prisma } from "@/lib/db";
import { AdminMissionsManager, type AdminMissionRow } from "@/components/admin/AdminMissionsManager";

export default async function AdminMissionsPage() {
  let rows: AdminMissionRow[] = [];
  try {
    const missions = await prisma.mission.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { _count: { select: { progress: true } } },
    });
    rows = missions.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      type: m.type,
      criterion: m.criterion,
      targetValue: Number(m.targetValue),
      rewardType: m.rewardType,
      rewardValue: Number(m.rewardValue),
      resets: m.resets,
      isActive: m.isActive,
      icon: m.icon,
      sortOrder: m.sortOrder,
      requiredLevel: m.requiredLevel ?? 1,
      progressCount: m._count.progress,
    }));
  } catch {
    rows = [];
  }

  return (
    <div>
      <p style={{ margin: "0 0 4px", color: "#6b7280", fontSize: 14 }}>
        Cadastre missões semanais, permanentes e metas de indicação. O progresso do usuário é
        atualizado automaticamente pelos critérios já ligados (Pix, depósito, compra, login e
        roleta).
      </p>
      <AdminMissionsManager initialRows={rows} />
    </div>
  );
}
