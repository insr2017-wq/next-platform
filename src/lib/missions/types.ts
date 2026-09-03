export type UserMissionView = {
  id: string;
  title: string;
  description: string;
  type: string;
  criterion: string;
  icon: string;
  targetValue: number;
  currentProgress: number;
  completed: boolean;
  redeemed: boolean;
  canRedeem: boolean;
  rewardType: string;
  rewardValue: number;
  rewardLabel: string;
  resets: boolean;
  sortOrder: number;
};
