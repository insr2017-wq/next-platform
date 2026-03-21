import Link from "next/link";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";
import { Page } from "@/components/layout/Page";
import { Card } from "@/components/ui/Card";
import { ProductCard } from "@/components/products/ProductCard";
import { Button } from "@/components/ui/Button";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { formatProductForCard } from "@/lib/product-format";

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function cycleTotal(r: {
  cycleDaysSnapshot: number;
  product: { cycleDays: number };
}) {
  return r.cycleDaysSnapshot >= 1 ? r.cycleDaysSnapshot : Math.max(1, r.product.cycleDays);
}

function dailyAmount(r: {
  dailyYieldSnapshot: number;
  product: { dailyYield: number };
}) {
  return r.dailyYieldSnapshot > 0 ? r.dailyYieldSnapshot : Number(r.product.dailyYield);
}

export default async function MyProductsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  type Row = Awaited<
    ReturnType<
      typeof prisma.userProduct.findMany<{ include: { product: true } }>
    >
  >[number];

  let purchaseRows: Row[] = [];
  try {
    purchaseRows = await prisma.userProduct.findMany({
      where: { userId: session.userId },
      include: { product: true },
      orderBy: { purchasedAt: "desc" },
    });
  } catch {
    purchaseRows = [];
  }

  const totalDaily = purchaseRows.reduce((s, p) => {
    const cycle = cycleTotal(p);
    if (p.earningStatus !== "active" || p.daysPaid >= cycle) return s;
    return s + dailyAmount(p);
  }, 0);

  const hasProducts = purchaseRows.length > 0;

  return (
    <Page title="Produtos adquiridos" backHref="/home" headerTone="brand">
      <div style={{ display: "grid", gap: 12 }}>
        <Card>
          <div
            style={{
              padding: 14,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(17,24,39,0.62)" }}>
                Total de produtos
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "rgba(17,24,39,0.92)" }}>
                {hasProducts ? purchaseRows.length : 0}
              </div>
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(17,24,39,0.62)" }}>
                Renda diária (ciclos ativos)
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "rgba(17,24,39,0.92)" }}>
                {brl.format(totalDaily)}
              </div>
            </div>
          </div>
        </Card>

        {hasProducts ? (
          <div style={{ display: "grid", gap: 14 }}>
            {purchaseRows.map((row) => {
              const dy = dailyAmount(row);
              const c = cycleTotal(row);
              const pc = formatProductForCard(row.product);
              const purchasedAtLabel = row.purchasedAt.toLocaleDateString("pt-BR");
              return (
                <div key={row.id} style={{ display: "grid", gap: 8 }}>
                  <ProductCard
                    product={pc}
                    href="/my-products"
                    subtitle=""
                    showActionButton={false}
                    showInfoRow={false}
                  />
                  <Card>
                    <div
                      style={{
                        padding: 12,
                        display: "grid",
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 10,
                        }}
                      >
                        <div style={{ display: "grid", gap: 3 }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(17,24,39,0.62)" }}>
                            Data de aquisição
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 900, color: "rgba(17,24,39,0.92)" }}>
                            {purchasedAtLabel}
                          </div>
                        </div>

                        <div style={{ display: "grid", gap: 3 }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(17,24,39,0.62)" }}>
                            Dias creditados
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 900, color: "rgba(17,24,39,0.92)" }}>
                            {row.daysPaid} dias
                          </div>
                        </div>

                        <div style={{ display: "grid", gap: 3 }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(17,24,39,0.62)" }}>
                            Valor investido
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 900, color: "rgba(17,24,39,0.92)" }}>
                            {pc.price}
                          </div>
                        </div>

                        <div style={{ display: "grid", gap: 3 }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(17,24,39,0.62)" }}>
                            Rendimento diário
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 900, color: "rgba(17,24,39,0.92)" }}>
                            {brl.format(dy)}
                          </div>
                        </div>
                      </div>

                      {row.daysPaid < c && row.earningStatus === "active" ? (
                        <div style={{ fontSize: 12, color: "rgba(17,24,39,0.55)", fontWeight: 700 }}>
                          {row.daysPaid}/{c} dias no ciclo
                        </div>
                      ) : null}
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        ) : (
          <Card>
            <div
              style={{
                padding: 18,
                display: "grid",
                justifyItems: "center",
                textAlign: "center",
                gap: 10,
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 999,
                  background: "var(--brand-light)",
                  border: "1px solid var(--brand-border)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Package size={26} color="var(--brand)" strokeWidth={2.2} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 900, color: "rgba(17,24,39,0.90)" }}>
                Você ainda não possui produtos
              </div>
              <div style={{ fontSize: 13, color: "rgba(17,24,39,0.62)" }}>
                Adquira um produto na página inicial para começar a gerar renda
              </div>
              <Link href="/home" style={{ width: "100%" }}>
                <Button
                  type="button"
                  fullWidth
                  style={{
                    borderRadius: 999,
                    padding: "14px 16px",
                    fontSize: 14,
                    fontWeight: 900,
                    boxShadow: "0 10px 20px var(--brand-shadow)",
                  }}
                >
                  Ver produtos disponíveis
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </Page>
  );
}
