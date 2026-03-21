type StreakInfoProps = {
  streakDays: number;
  nextBonus: string;
};

export function StreakInfo({ streakDays, nextBonus }: StreakInfoProps) {
  return (
    <div
      style={{
        padding: "8px 4px 0",
        display: "grid",
        gap: 6,
        fontSize: 12,
        color: "rgba(17,24,39,0.70)",
        lineHeight: 1.45,
      }}
    >
      <div>
        Sequência atual:{" "}
        <span style={{ fontWeight: 900 }}>{streakDays} dias</span>
      </div>
      <div>
        Próximo bônus:{" "}
        <span style={{ fontWeight: 900 }}>{nextBonus}</span>
      </div>
    </div>
  );
}

