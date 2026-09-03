import Link from "next/link";
import { Page } from "@/components/layout/Page";

export default function NotFound() {
  return (
    <Page title="Página não encontrada" backHref="/home">
      <p style={{ padding: "8px 0", color: "var(--text-muted)" }}>
        Esta página não existe.
      </p>
      <p style={{ padding: "4px 0" }}>
        <Link href="/home" style={{ fontWeight: 700, color: "var(--brand)" }}>
          Voltar ao início
        </Link>
      </p>
    </Page>
  );
}

