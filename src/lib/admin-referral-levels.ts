/**
 * Níveis 1–3 sob um indicador (root), alinhado à árvore de `Referral`:
 * L1 = convidados diretos; L2 = convidados de alguém em L1; L3 = convidados de alguém em L2.
 * Quem aparece em mais de um passo fica no menor nível (primeira atribuição vence).
 */
export function buildChildrenByInviter(
  edges: { inviterId: string; invitedUserId: string }[]
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const e of edges) {
    if (!map.has(e.inviterId)) map.set(e.inviterId, []);
    map.get(e.inviterId)!.push(e.invitedUserId);
  }
  return map;
}

export function teamLevelByUserId(
  rootId: string,
  childrenByInviter: Map<string, string[]>
): Map<string, 1 | 2 | 3> {
  const level = new Map<string, 1 | 2 | 3>();

  for (const id of childrenByInviter.get(rootId) ?? []) {
    if (id !== rootId) level.set(id, 1);
  }

  const level1Ids = [...level.keys()].filter((id) => level.get(id) === 1);
  for (const id of level1Ids) {
    for (const c of childrenByInviter.get(id) ?? []) {
      if (c === rootId) continue;
      if (!level.has(c)) level.set(c, 2);
    }
  }

  const level2Ids = [...level.keys()].filter((id) => level.get(id) === 2);
  for (const id of level2Ids) {
    for (const c of childrenByInviter.get(id) ?? []) {
      if (c === rootId) continue;
      if (!level.has(c)) level.set(c, 3);
    }
  }

  return level;
}

export type DepositByLevel = { level: 1 | 2 | 3; memberCount: number; depositTotal: number };

export function aggregateDepositsByLevel(
  levelByUserId: Map<string, 1 | 2 | 3>,
  paidSumByUserId: Map<string, number>
): DepositByLevel[] {
  const dep: Record<1 | 2 | 3, number> = { 1: 0, 2: 0, 3: 0 };
  const cnt: Record<1 | 2 | 3, number> = { 1: 0, 2: 0, 3: 0 };
  for (const [uid, lv] of levelByUserId) {
    if (lv !== 1 && lv !== 2 && lv !== 3) continue;
    cnt[lv]++;
    dep[lv] += paidSumByUserId.get(uid) ?? 0;
  }
  return [
    { level: 1 as const, memberCount: cnt[1], depositTotal: dep[1] },
    { level: 2 as const, memberCount: cnt[2], depositTotal: dep[2] },
    { level: 3 as const, memberCount: cnt[3], depositTotal: dep[3] },
  ];
}
