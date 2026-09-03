export const MISSION_TYPES = ["semanal", "permanente", "meta_indicacao"] as const;
export type MissionType = (typeof MISSION_TYPES)[number];

export const MISSION_CRITERIA = [
  "login_streak",
  "roleta_streak",
  "indicados_ativos",
  "volume_rede",
  "primeiro_deposito_min",
  "cadastro_chave_pix",
  "compra_produto",
] as const;
export type MissionCriterion = (typeof MISSION_CRITERIA)[number];

export const MISSION_REWARD_TYPES = [
  "valor_fixo",
  "giro_extra_roleta",
  "percentual_comissao_extra",
] as const;
export type MissionRewardType = (typeof MISSION_REWARD_TYPES)[number];

export const MISSION_ICONS = [
  "clock",
  "shield",
  "zap",
  "users",
  "target",
  "trophy",
  "gift",
  "wallet",
  "shopping",
  "star",
] as const;
export type MissionIcon = (typeof MISSION_ICONS)[number];

export const SNAPSHOT_CRITERIA: ReadonlySet<string> = new Set([
  "cadastro_chave_pix",
  "primeiro_deposito_min",
  "compra_produto",
  "indicados_ativos",
  "volume_rede",
]);

export const MISSION_TYPE_LABELS: Record<MissionType, string> = {
  semanal: "Semanal",
  permanente: "Permanente",
  meta_indicacao: "Meta de indicação",
};

export const MISSION_CRITERION_LABELS: Record<string, string> = {
  login_streak: "Sequência de login (dias)",
  roleta_streak: "Sequência de roleta (dias)",
  indicados_ativos: "Indicados ativos / novos",
  volume_rede: "Volume da rede (R$)",
  primeiro_deposito_min: "Primeiro depósito mínimo (R$)",
  cadastro_chave_pix: "Cadastro de chave Pix",
  compra_produto: "Compra de produto",
};

export const MISSION_REWARD_LABELS: Record<MissionRewardType, string> = {
  valor_fixo: "Valor fixo (R$)",
  giro_extra_roleta: "Giro extra na roleta",
  percentual_comissao_extra: "% extra de comissão",
};

export const MISSION_ICON_LABELS: Record<string, string> = {
  clock: "Relógio",
  shield: "Escudo",
  zap: "Raio",
  users: "Usuários",
  target: "Alvo",
  trophy: "Troféu",
  gift: "Presente",
  wallet: "Carteira",
  shopping: "Compra",
  star: "Estrela",
};

export function isMissionType(v: string): v is MissionType {
  return (MISSION_TYPES as readonly string[]).includes(v);
}

export function isMissionRewardType(v: string): v is MissionRewardType {
  return (MISSION_REWARD_TYPES as readonly string[]).includes(v);
}

export function isMissionIcon(v: string): v is MissionIcon {
  return (MISSION_ICONS as readonly string[]).includes(v);
}

/** Critério livre (a-z, 0-9 e _), para o admin incluir tipos novos sem migrar o banco. */
export function isMissionCriterionKey(v: string): boolean {
  return /^[a-z][a-z0-9_]{1,63}$/.test(v);
}
