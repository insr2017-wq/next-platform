import { Page } from "@/components/layout/Page";
import { ProductCard } from "@/components/products/ProductCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ActivityTicker } from "@/components/dashboard/ActivityTicker";
import { prisma } from "@/lib/db";
import { formatProductForCard } from "@/lib/product-format";
import { getPlatformSettings } from "@/lib/platform-settings";
import { WelcomeModalClient } from "@/components/welcome/WelcomeModalClient";

export default async function HomePage() {
  let products: ReturnType<typeof formatProductForCard>[] = [];
  let settings = await getPlatformSettings();
  try {
    const list = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
    products = list.map(formatProductForCard);
  } catch {
    products = [];
  }

  return (
    <Page
      title="Início"
      hideHeader
      topBanner={{ src: "/home-banner.png", alt: "Banner", height: 180, fullWidth: true }}
    >
      <WelcomeModalClient
        enabled={settings.welcomeModalEnabled}
        title={settings.welcomeModalTitle}
        text={settings.welcomeModalText}
        link={settings.welcomeModalLink}
      />
      <div style={{ display: "grid", gap: 12 }}>
        <QuickActions
          elevated
          actions={[
            { href: "/deposit", label: "Recarga", icon: "wallet" },
            { href: "/withdraw", label: "Saque", icon: "withdraw" },
            { href: "/my-products", label: "Produtos adquiridos", icon: "box" },
            { href: "/check-in", label: "Check-in diário", icon: "check" },
          ]}
        />

        <ActivityTicker />

        {products.length === 0 ? (
          <div
            style={{
              padding: 24,
              textAlign: "center",
              background: "var(--surface)",
              borderRadius: 14,
              border: "1px solid var(--border)",
              color: "#6b7280",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Nenhum produto disponível no momento.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {products.map((p) => (
              <ProductCard key={p.id} product={p} href={`/comprar/${p.id}`} />
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}
