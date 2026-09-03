import { formatBRL } from "@/lib/format-brl";
import type { MissionRewardType } from "./constants";

export function formatMissionReward(rewardType: string, rewardValue: number): string {
  if (rewardType === "giro_extra_roleta") {
    const n = Math.max(1, Math.round(rewardValue));
    return n === 1 ? "Giro extra" : `${n} giros extra`;
  }
  if (rewardType === "percentual_comissao_extra") {
    return `+${rewardValue}% comissão`;
  }
  return formatBRL(rewardValue);
}

export function formatMissionProgress(current: number, target: number, criterion: string): string {
  const cur = Math.min(current, target);
  if (criterion === "volume_rede" || criterion === "primeiro_deposito_min") {
    return `${formatBRL(cur)} / ${formatBRL(target)}`;
  }
  if (target === 1 && (criterion === "cadastro_chave_pix" || criterion === "compra_produto")) {
    return current >= 1 ? "1/1" : "0/1";
  }
  return `${Math.floor(cur)}/${Math.floor(target)}`;
}

export type { MissionRewardType };
