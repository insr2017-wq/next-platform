import {
  isMissionCriterionKey,
  isMissionIcon,
  isMissionRewardType,
  isMissionType,
  MISSION_ICONS,
} from "./constants";

export type MissionPayload = {
  title: string;
  description: string;
  type: string;
  criterion: string;
  targetValue: number;
  rewardType: string;
  rewardValue: number;
  resets: boolean;
  isActive: boolean;
  icon: string;
  sortOrder: number;
  requiredLevel?: number;
};

function parseNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = parseFloat(v.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function parseIntSafe(v: unknown): number | null {
  if (typeof v === "number" && Number.isInteger(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = parseInt(v, 10);
    return Number.isInteger(n) ? n : null;
  }
  return null;
}

export function parseMissionBody(
  body: unknown,
  partial = false
): { ok: true; data: Partial<MissionPayload> } | { ok: false; error: string } {
  const b = (body ?? {}) as Record<string, unknown>;
  const data: Partial<MissionPayload> = {};

  if (!partial || b.title !== undefined) {
    const title = typeof b.title === "string" ? b.title.trim() : "";
    if (!title || title.length > 120) {
      return { ok: false, error: "Informe um título (até 120 caracteres)." };
    }
    data.title = title;
  }

  if (!partial || b.description !== undefined) {
    const description = typeof b.description === "string" ? b.description.trim() : "";
    if (description.length > 500) {
      return { ok: false, error: "Descrição muito longa (máx. 500)." };
    }
    data.description = description;
  }

  if (!partial || b.type !== undefined) {
    const type = typeof b.type === "string" ? b.type.trim() : "";
    if (!isMissionType(type)) {
      return { ok: false, error: "Tipo inválido. Use semanal, permanente ou meta_indicacao." };
    }
    data.type = type;
  }

  if (!partial || b.criterion !== undefined) {
    const criterion = typeof b.criterion === "string" ? b.criterion.trim() : "";
    if (!isMissionCriterionKey(criterion)) {
      return {
        ok: false,
        error: "Critério inválido. Use letras minúsculas, números e underscore (ex.: login_streak).",
      };
    }
    data.criterion = criterion;
  }

  if (!partial || b.targetValue !== undefined) {
    const targetValue = parseNumber(b.targetValue);
    if (targetValue == null || targetValue <= 0) {
      return { ok: false, error: "Informe a meta (número maior que zero)." };
    }
    data.targetValue = targetValue;
  }

  if (!partial || b.rewardType !== undefined) {
    const rewardType = typeof b.rewardType === "string" ? b.rewardType.trim() : "";
    if (!isMissionRewardType(rewardType)) {
      return { ok: false, error: "Tipo de recompensa inválido." };
    }
    data.rewardType = rewardType;
  }

  if (!partial || b.rewardValue !== undefined) {
    const rewardValue = parseNumber(b.rewardValue);
    if (rewardValue == null || rewardValue < 0) {
      return { ok: false, error: "Informe o valor da recompensa." };
    }
    data.rewardValue = rewardValue;
  }

  if (b.resets !== undefined) {
    data.resets = b.resets === true || b.resets === "true";
  } else if (!partial) {
    data.resets = data.type === "semanal";
  }

  if (!partial || b.isActive !== undefined) {
    data.isActive = b.isActive !== false && b.isActive !== "false";
  }

  if (!partial || b.icon !== undefined) {
    const icon = typeof b.icon === "string" ? b.icon.trim() : "target";
    data.icon = isMissionIcon(icon) ? icon : MISSION_ICONS[4];
  }

  if (!partial || b.sortOrder !== undefined) {
    const sortOrder = parseIntSafe(b.sortOrder);
    data.sortOrder = sortOrder == null ? 0 : sortOrder;
  }

  if (!partial || b.requiredLevel !== undefined) {
    const requiredLevel = parseIntSafe(b.requiredLevel);
    data.requiredLevel = requiredLevel == null ? 1 : Math.min(3, Math.max(1, requiredLevel));
  }

  if (partial && Object.keys(data).length === 0) {
    return { ok: false, error: "Nenhuma alteração." };
  }

  return { ok: true, data };
}
