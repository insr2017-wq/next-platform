"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/format-brl";

interface ProfitEvolutionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentProfit?: string;
}

type HistoryPoint = { day: string; value: number };

export function ProfitEvolutionModal({ isOpen, onOpenChange }: ProfitEvolutionModalProps) {
  const [period, setPeriod] = React.useState<"7d" | "30d" | "90d">("7d");
  const [points, setPoints] = React.useState<HistoryPoint[]>([]);
  const [periodProfit, setPeriodProfit] = React.useState(0);
  const [growthPercent, setGrowthPercent] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    let cancelled = false;
    setLoading(true);
    void fetch(`/api/user/profit-history?days=${days}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setPoints(Array.isArray(data.points) ? data.points : []);
        setPeriodProfit(Number(data.periodProfit) || 0);
        setGrowthPercent(Number(data.growthPercent) || 0);
      })
      .catch(() => {
        if (cancelled) return;
        setPoints([]);
        setPeriodProfit(0);
        setGrowthPercent(0);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, period]);

  const chartData = points.length > 0 ? points : [{ day: "—", value: 0 }];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[400px] max-w-[95vw] overflow-hidden rounded-3xl border-border bg-surface p-0">
        <div className="space-y-6 p-6">
          <DialogHeader>
            <DialogTitle className="text-sm font-black tracking-widest text-primary uppercase italic">
              Evolução do Lucro
            </DialogTitle>
          </DialogHeader>
          <div className="flex rounded-xl border border-border bg-background p-1">
            {(["7d", "30d", "90d"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={cn(
                  "flex-1 rounded-lg py-2 text-[10px] font-black uppercase",
                  period === p ? "bg-primary text-black" : "text-muted-foreground",
                )}
              >
                {p === "7d" ? "7 Dias" : p === "30d" ? "30 Dias" : "90 Dias"}
              </button>
            ))}
          </div>
          <div className="-ml-4 h-[200px] w-full">
            {loading ? (
              <div className="flex h-full items-center justify-center text-[10px] font-bold text-muted uppercase">
                Carregando...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A3E635" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#A3E635" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#666", fontSize: 10 }} />
                  <YAxis hide domain={["dataMin - 50", "dataMax + 50"]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0D1117", border: "1px solid #A3E63530", borderRadius: 12, fontSize: 10 }}
                    itemStyle={{ color: "#A3E635" }}
                    formatter={(value) => [formatBRL(Number(value) || 0), "Lucro"]}
                  />
                  <Area type="monotone" dataKey="value" stroke="#A3E635" strokeWidth={3} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-background p-4">
            <div>
              <p className="text-[9px] font-bold text-muted uppercase">Lucro no Período</p>
              <p className="text-lg font-black text-primary italic">{formatBRL(periodProfit)}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-muted uppercase">Crescimento</p>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-primary" />
                <p className="text-lg font-black text-primary italic">+{growthPercent.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
