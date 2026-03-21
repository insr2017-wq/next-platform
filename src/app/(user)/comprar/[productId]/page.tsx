import { notFound, redirect } from "next/navigation";
import { Page } from "@/components/layout/Page";
import { Card } from "@/components/ui/Card";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { PurchaseClient } from "./PurchaseClient";

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default async function ComprarProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (session.role === "admin") {
    redirect("/admin/products");
  }

  const { productId } = await params;
  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true },
  });
  if (!product) {
    notFound();
  }

  const url = product.imageUrl?.trim() ?? "";
  const src =
    url && (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/"))
      ? url
      : null;

  return (
    <Page title="Comprar produto" backHref="/home" headerTone="brand">
      <div style={{ display: "grid", gap: 16 }}>
        <Card>
          <div style={{ display: "grid", gap: 12 }}>
            <div
              style={{
                width: "100%",
                aspectRatio: "16 / 9",
                background: "#f3f4f6",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={src}
                  alt={product.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 800,
                    color: "#9ca3af",
                  }}
                >
                  {product.name}
                </div>
              )}
            </div>
            <div style={{ padding: "0 14px 14px" }}>
              <h1 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 900 }}>{product.name}</h1>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 10,
                  fontSize: 14,
                }}
              >
                <div>
                  <div style={{ color: "#6b7280", fontWeight: 700, fontSize: 12 }}>Preço</div>
                  <div style={{ fontWeight: 900 }}>{brl.format(product.price)}</div>
                </div>
                <div>
                  <div style={{ color: "#6b7280", fontWeight: 700, fontSize: 12 }}>Rendimento diário</div>
                  <div style={{ fontWeight: 900 }}>{brl.format(product.dailyYield)}</div>
                </div>
                <div>
                  <div style={{ color: "#6b7280", fontWeight: 700, fontSize: 12 }}>Ciclo</div>
                  <div style={{ fontWeight: 900 }}>
                    {product.cycleDays} {product.cycleDays === 1 ? "dia" : "dias"}
                  </div>
                </div>
                <div>
                  <div style={{ color: "#6b7280", fontWeight: 700, fontSize: 12 }}>Retorno total</div>
                  <div style={{ fontWeight: 900 }}>{brl.format(product.totalReturn)}</div>
                </div>
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div style={{ padding: 16 }}>
            <h2 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 800 }}>
              Confirmar aquisição
            </h2>
            <p style={{ margin: "0 0 16px", fontSize: 14, color: "#6b7280" }}>
              O valor será debitado do seu saldo.
            </p>
            <PurchaseClient
              productId={product.id}
              productName={product.name}
              priceLabel={brl.format(product.price)}
            />
          </div>
        </Card>
      </div>
    </Page>
  );
}
