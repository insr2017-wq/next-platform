type EmptyStateProps = {
  message: string;
};

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div
      style={{
        padding: "32px var(--gutter)",
        textAlign: "center",
        color: "#6b7280",
        fontSize: 14,
        fontWeight: 600,
        background: "var(--surface)",
        borderRadius: 12,
        border: "1px solid var(--border)",
        marginTop: 12,
      }}
    >
      {message}
    </div>
  );
}
