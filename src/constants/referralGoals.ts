export interface ReferralGoal {
  level: number;
  target: number;
  reward: number;
}

export const ACTIVE_REFERRALS = 0;

export const REFERRAL_GOALS: ReferralGoal[] = [
  { level: 1, target: 3, reward: 10 },
  { level: 2, target: 5, reward: 20 },
  { level: 3, target: 10, reward: 50 },
  { level: 4, target: 15, reward: 80 },
  { level: 5, target: 25, reward: 150 },
  { level: 6, target: 40, reward: 300 },
  { level: 7, target: 60, reward: 500 },
];

export const formatGoalBRL = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const getNextGoal = (current: number = ACTIVE_REFERRALS) =>
  REFERRAL_GOALS.find((g) => current < g.target) ?? null;
