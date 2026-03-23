import Link from "next/link";

type HeaderProps = {
  title: string;
  backHref?: string;
  tone?: "brand" | "neutral";
};

export function Header({ title, backHref, tone = "brand" }: HeaderProps) {
  const isBrand = tone === "brand";
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        height: "var(--header-height)",
        display: "flex",
        alignItems: "center",
        borderBottom: isBrand ? "none" : "1px solid var(--border)",
        backdropFilter: "blur(8px)",
        background: isBrand
          ? "linear-gradient(160deg, var(--brand) 0%, var(--brand-2) 100%)"
          : "rgba(255,255,255,0.9)",
        color: isBrand ? "#fff" : "var(--text)",
        boxShadow: isBrand ? "0 6px 18px rgba(var(--brand-rgb), 0.22)" : "none",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "var(--container-max)",
          margin: "0 auto",
          paddingLeft: "var(--gutter)",
          paddingRight: "var(--gutter)",
          display: "grid",
          gridTemplateColumns: "64px 1fr 64px",
          alignItems: "center",
        }}
      >
        <div style={{ justifySelf: "start" }}>
          {backHref ? (
            <Link
              href={backHref}
              style={{
                color: "inherit",
                fontWeight: 800,
                display: "inline-grid",
                placeItems: "center",
                width: 36,
                height: 36,
                borderRadius: 12,
                border: isBrand ? "1px solid rgba(255,255,255,0.28)" : "1px solid var(--border)",
                background: isBrand ? "rgba(255,255,255,0.1)" : "var(--surface)",
              }}
              aria-label="Voltar"
            >
              ←
            </Link>
          ) : null}
        </div>
        <div style={{ justifySelf: "center", fontWeight: 900, letterSpacing: 0.2 }}>{title}</div>
        <div />
      </div>
    </header>
  );
}

