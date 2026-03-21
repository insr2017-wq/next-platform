import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { ProductCardImage } from "@/components/products/ProductCardImage";

export type Product = {
  id: string;
  name: string;
  imageUrl?: string;
  price: string;
  dailyIncome: string;
  cycle: string;
  total: string;
};

type ProductCardProps = {
  product: Product;
  href?: string;
  subtitle?: string;
  actionLabel?: string;
  showActionButton?: boolean;
  showInfoRow?: boolean;
};

function ProductMedia({ name, imageUrl }: { name: string; imageUrl?: string }) {
  const src =
    imageUrl &&
    (imageUrl.startsWith("http://") ||
      imageUrl.startsWith("https://") ||
      imageUrl.startsWith("/"))
      ? imageUrl
      : null;

  if (src) {
    return <ProductCardImage name={name} src={src} />;
  }

  return (
    <div
      style={{
        width: "100%",
        aspectRatio: "16 / 9",
        background: "linear-gradient(135deg, #e5e7eb, #f9fafb)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          background:
            "radial-gradient(circle at 20% 20%, rgba(248,250,252,1), transparent 55%), radial-gradient(circle at 80% 80%, rgba(248,250,252,0.9), transparent 55%)",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "flex-start",
          padding: 16,
        }}
      >
        <div
          style={{
            background: "rgba(0,0,0,0.24)",
            color: "#fff",
            padding: "4px 10px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {name}
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  items,
}: {
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 10,
        padding: 12,
        borderRadius: 12,
        border: "1px solid rgba(229,231,235,0.95)",
        background: "#fff",
      }}
    >
      {items.map((it) => (
        <div key={it.label} style={{ display: "grid", gap: 4 }}>
          <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 800 }}>
            {it.label}
          </div>
          <div style={{ fontSize: 13, fontWeight: 900 }}>{it.value}</div>
        </div>
      ))}
    </div>
  );
}

export function ProductCard({
  product,
  href = "/deposit",
  subtitle = "Renda diária • saque diário",
  actionLabel = "Comprar agora",
  showActionButton = true,
  showInfoRow = true,
}: ProductCardProps) {
  const hasSubtitle = subtitle.trim().length > 0;
  return (
    <Card>
      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ padding: "14px 14px 0" }}>
            <div
              style={{
                fontSize: 18,
                fontWeight: 900,
                textAlign: "center",
                marginBottom: 4,
              }}
            >
              {product.name}
            </div>
            {hasSubtitle && (
              <div
                style={{
                  fontSize: 12,
                  color: "var(--brand)",
                  fontWeight: 800,
                  textAlign: "center",
                }}
              >
                {subtitle}
              </div>
            )}
          </div>
          <ProductMedia name={product.name} imageUrl={product.imageUrl} />
        </div>

        {showInfoRow && (
          <div style={{ padding: "0 14px" }}>
            <InfoRow
              items={[
                { label: "Preço", value: product.price },
                { label: "Diário", value: product.dailyIncome },
                { label: "Ciclo", value: product.cycle },
                { label: "Total", value: product.total },
              ]}
            />
          </div>
        )}

        {showActionButton && (
          <div style={{ padding: "0 14px 14px" }}>
            <Link
              href={href}
              style={{
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                border: "1px solid var(--brand)",
                background: "var(--brand)",
                color: "#fff",
                borderRadius: 999,
                padding: "14px 14px",
                fontWeight: 900,
              }}
            >
              {actionLabel}
            </Link>
          </div>
        )}
      </div>
    </Card>
  );
}

