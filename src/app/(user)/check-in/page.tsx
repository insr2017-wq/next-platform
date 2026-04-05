"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Page } from "@/components/layout/Page";
import { RewardCard } from "@/components/checkin/RewardCard";
import { DayItem } from "@/components/checkin/DayItem";
import { StreakInfo } from "@/components/checkin/StreakInfo";
import { Button } from "@/components/ui/Button";

type DayStatus = "resgatado" | "hoje" | "bloqueado";

type Day = {
  id: number;
  label: string;
  bonus: string;
  status: DayStatus;
};

type CheckInState = {
  canCheckIn: boolean;
  days: Day[];
  streakDays: number;
  nextBonus: string;
  blockedMessage?: string;
};

const emptyDays: Day[] = Array.from({ length: 7 }, (_, i) => ({
  id: i + 1,
  label: `Dia ${i + 1}`,
  bonus: "—",
  status: "bloqueado" as DayStatus,
}));

export default function CheckInPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [state, setState] = useState<CheckInState | null>(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/check-in", { method: "GET" });
      const data = (await res.json()) as CheckInState & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Não foi possível carregar.");
        setState(null);
        return;
      }
      setState({
        canCheckIn: data.canCheckIn,
        days: data.days,
        streakDays: data.streakDays,
        nextBonus: data.nextBonus,
        blockedMessage: data.blockedMessage,
      });
    } catch {
      setError("Erro de conexão.");
      setState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleClaim = async () => {
    if (!state?.canCheckIn || claiming) return;
    setSuccess("");
    setError("");
    setClaiming(true);
    try {
      const res = await fetch("/api/check-in", { method: "POST" });
      const data = (await res.json()) as {
        error?: string;
        success?: boolean;
        message?: string;
        days?: Day[];
        canCheckIn?: boolean;
        streakDays?: number;
        nextBonus?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Não foi possível resgatar.");
        await load();
        return;
      }
      if (data.message) setSuccess(data.message);
      if (data.days && data.streakDays !== undefined && data.nextBonus) {
        setState({
          canCheckIn: Boolean(data.canCheckIn),
          days: data.days,
          streakDays: data.streakDays,
          nextBonus: data.nextBonus,
          blockedMessage:
            "Check-in já realizado hoje. Disponível novamente após 00:00.",
        });
      } else {
        await load();
      }
      router.refresh();
    } catch {
      setError("Erro de conexão.");
    } finally {
      setClaiming(false);
    }
  };

  const days = state?.days ?? (loading ? emptyDays : emptyDays);
  const canCheckIn = state?.canCheckIn ?? false;
  const streakDays = state?.streakDays ?? 0;
  const nextBonus = state?.nextBonus ?? "—";

  return (
    <Page title="Check-in diário" backHref="/home" headerTone="brand">
      <div style={{ display: "grid", gap: 14 }}>
        <RewardCard />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 10,
          }}
        >
          {days.map((day) => (
            <DayItem
              key={day.id}
              label={day.label}
              bonus={day.bonus}
              status={day.status}
            />
          ))}
        </div>

        {state?.blockedMessage && !canCheckIn ? (
          <div
            role="status"
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              background: "rgba(243,244,246,0.95)",
              border: "1px solid rgba(229,231,235,1)",
              fontSize: 13,
              fontWeight: 700,
              color: "rgba(55,65,81,1)",
              lineHeight: 1.45,
              textAlign: "center",
            }}
          >
            {state.blockedMessage}
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              background: "#fef2f2",
              color: "#b91c1c",
              fontSize: 13,
              fontWeight: 700,
              textAlign: "center",
            }}
          >
            {error}
          </div>
        ) : null}

        {success ? (
          <div
            role="status"
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              background: "rgba(var(--brand-rgb), 0.08)",
              border: "1px solid var(--brand-border)",
              color: "rgba(17,24,39,0.9)",
              fontSize: 13,
              fontWeight: 700,
              textAlign: "center",
            }}
          >
            {success}
          </div>
        ) : null}

        <Button
          type="button"
          fullWidth
          disabled={loading || !state || !canCheckIn || claiming}
          style={{
            borderRadius: 999,
            padding: "15px 16px",
            fontSize: 15,
            fontWeight: 900,
            boxShadow: "0 10px 20px var(--brand-shadow)",
            opacity: !canCheckIn && state ? 0.65 : 1,
          }}
          onClick={() => void handleClaim()}
        >
          {claiming
            ? "Resgatando…"
            : canCheckIn
              ? "Resgatar bônus de hoje"
              : "Check-in já realizado hoje"}
        </Button>

        <div
          style={{
            padding: "4px 4px 0",
            fontSize: 12,
            color: "rgba(17,24,39,0.65)",
            lineHeight: 1.4,
          }}
        >
          Não perca seu check-in de hoje.
        </div>

        <StreakInfo streakDays={streakDays} nextBonus={nextBonus} />
      </div>
    </Page>
  );
}
