import { LucideIcon, Trophy, Shield, Star, Crown, Gem } from "lucide-react";

export type UserLevel = "Bronze" | "Prata" | "Ouro" | "Elite" | "Diamante";

export interface LevelConfig {
  name: UserLevel;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeColor: string;
  nextLevel: UserLevel | null;
  investmentRequired: number;
  referralsRequired: number;
}

export const LEVELS: Record<UserLevel, LevelConfig> = {
  Bronze: {
    name: "Bronze",
    icon: Trophy,
    color: "text-[#CD7F32]",
    bgColor: "bg-[#CD7F32]/10",
    borderColor: "border-[#CD7F32]/20",
    badgeColor: "#CD7F32",
    nextLevel: "Prata",
    investmentRequired: 500,
    referralsRequired: 3,
  },
  Prata: {
    name: "Prata",
    icon: Shield,
    color: "text-slate-300",
    bgColor: "bg-slate-300/10",
    borderColor: "border-slate-300/20",
    badgeColor: "#CBD5E1",
    nextLevel: "Ouro",
    investmentRequired: 1500,
    referralsRequired: 7,
  },
  Ouro: {
    name: "Ouro",
    icon: Star,
    color: "text-yellow-400",
    bgColor: "bg-yellow-400/10",
    borderColor: "border-yellow-400/20",
    badgeColor: "#FACC15",
    nextLevel: "Elite",
    investmentRequired: 5000,
    referralsRequired: 15,
  },
  Elite: {
    name: "Elite",
    icon: Crown,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/20",
    badgeColor: "#A3E635",
    nextLevel: "Diamante",
    investmentRequired: 15000,
    referralsRequired: 30,
  },
  Diamante: {
    name: "Diamante",
    icon: Gem,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    borderColor: "border-blue-400/20",
    badgeColor: "#60A5FA",
    nextLevel: null,
    investmentRequired: 0,
    referralsRequired: 0,
  },
};
