import { CheckCircle2, Lock } from "lucide-react";

type Status = "resgatado" | "hoje" | "bloqueado";

type DayItemProps = {
  label: string;
  bonus: string;
  status: Status;
};

export function DayItem({ label, bonus, status }: DayItemProps) {
  const isToday = status === "hoje";
  const isClaimed = status === "resgatado";

  const borderColor = isToday
    ? "var(--brand)"
    : isClaimed
      ? "rgba(209,213,219,1)"
      : "rgba(229,231,235,1)";

  const background =
    status === "bloqueado" ? "#f9fafb" : "#ffffff";

  const opacity = status === "bloqueado" ? 0.55 : 1;

  return (
    <div
      style={{
        borderRadius: 14,
        border: `1px solid ${borderColor}`,
        background,
        padding: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        textAlign: "center",
        opacity,
        minHeight: 86,
        boxShadow: "0 4px 14px rgba(15,23,42,0.04)",
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: isToday ? "var(--brand)" : "rgba(15,23,42,0.75)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 900,
          color: "rgba(15,23,42,0.90)",
        }}
      >
        {bonus}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 4,
          fontSize: 10,
          fontWeight: 700,
          color: isToday
            ? "var(--brand)"
            : isClaimed
              ? "rgba(107,114,128,1)"
              : "rgba(148,163,184,1)",
        }}
      >
        {isClaimed && (
          <CheckCircle2 size={13} color="rgba(107,114,128,1)" strokeWidth={2.4} />
        )}
        {status === "bloqueado" && (
          <Lock size={12} color="rgba(148,163,184,1)" strokeWidth={2.1} />
        )}
        <span>
          {status === "resgatado"
            ? "Resgatado"
            : status === "hoje"
              ? "Hoje"
              : "Bloqueado"}
        </span>
      </div>
    </div>
  );
}

