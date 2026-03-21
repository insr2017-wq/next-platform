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
        background: isBrand ? "var(--brand)" : "var(--bg)",
        color: isBrand ? "#fff" : "var(--text)",
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
            <Link href={backHref} style={{ color: "inherit", fontWeight: 800 }}>
              Voltar
            </Link>
          ) : null}
        </div>
        <div style={{ justifySelf: "center", fontWeight: 800 }}>{title}</div>
        <div />
      </div>
    </header>
  );
}

