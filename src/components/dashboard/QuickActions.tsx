import { Card } from "@/components/ui/Card";
import { QuickActionItem } from "@/components/dashboard/QuickActionItem";
import { ArrowUpCircle, CalendarCheck, Package, Wallet } from "lucide-react";

type Action = {
  href: string;
  label: string;
  icon: "wallet" | "withdraw" | "box" | "check";
};

type QuickActionsProps = {
  actions: Action[];
  elevated?: boolean;
};

export function QuickActions({ actions, elevated }: QuickActionsProps) {
  const iconMap = {
    wallet: Wallet,
    withdraw: ArrowUpCircle,
    box: Package,
    check: CalendarCheck,
  } as const;

  return (
    <Card elevated={elevated}>
      <div
        style={{
          padding: elevated ? 22 : 18,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: elevated ? 12 : 10,
        }}
      >
        {actions.map((a) => {
          const Icon = iconMap[a.icon];
          return (
            <QuickActionItem
              key={a.href}
              href={a.href}
              label={a.label}
              Icon={Icon}
            />
          );
        })}
      </div>
    </Card>
  );
}

