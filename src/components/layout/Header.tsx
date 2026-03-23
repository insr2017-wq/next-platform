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
        borderBottom: isBrand ? "1px solid rgba(198,220,255,0.22)" : "1px solid var(--border)",
        background: isBrand
          ? "linear-gradient(120deg, rgba(11,47,110,0.94) 0%, rgba(15,76,179,0.92) 58%, rgba(11,114,211,0.9) 100%)"
          : "rgba(255,255,255,0.88)",
        backdropFilter: "blur(10px)",
        color: isBrand ? "#f4f8ff" : "var(--text)",
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
              aria-label="Voltar"
              style={{
                color: "inherit",
                fontWeight: 900,
                width: 38,
                height: 38,
                borderRadius: 12,
                border: isBrand ? "1px solid rgba(220,234,255,0.28)" : "1px solid var(--border)",
                background: isBrand ? "rgba(255,255,255,0.12)" : "rgba(15,76,179,0.06)",
                display: "grid",
                placeItems: "center",
                fontSize: 20,
                lineHeight: 1,
              }}
            >
              ←
            </Link>
          ) : null}
        </div>
        <div style={{ justifySelf: "center", fontWeight: 900, letterSpacing: 0.4, fontSize: 18 }}>
          {title}
        </div>
        <div />
      </div>
    </header>
  );
}

