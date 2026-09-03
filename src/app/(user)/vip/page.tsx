import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { mapProductsToCatalog, mapUserProductsToOrders } from "@/lib/vip-catalog";
import { getPlatformSettings } from "@/lib/platform-settings";
import { VipClient } from "./VipClient";

export default async function VipPage() {
  const session = await getSession();
  if (!session || session.role !== "user") {
    redirect("/login");
  }

  try {
    const [products, userProducts, settings] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.userProduct.findMany({
        where: { userId: session.userId },
        include: { product: true },
        orderBy: { purchasedAt: "desc" },
      }),
      getPlatformSettings(),
    ]);

    return (
      <VipClient
        catalog={mapProductsToCatalog(products)}
        orders={mapUserProductsToOrders(userProducts)}
        cashback={{
          cashbackPercent: settings.cashbackPercent,
          cashbackBandAmount: settings.cashbackBandAmount,
          cashbackMinInvest: settings.cashbackMinInvest,
        }}
      />
    );
  } catch (e) {
    console.error("[vip/page] falha ao carregar produtos:", e);
    throw e;
  }
}
