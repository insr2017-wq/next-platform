import { misticPayGateway } from "@/lib/gateways/misticpay";
import { applyNormalizedWebhookEvent } from "@/lib/gateways/apply-webhook";

export const dynamic = "force-dynamic";

export async function GET() {
  return new Response("OK", { status: 200 });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  console.log("[MisticPay] WEBHOOK CHEGOU", JSON.stringify(body));

  const event = misticPayGateway.parseWebhook(body);
  if (!event) {
    console.warn("[MisticPay] webhook_payload_unrecognized");
    return new Response("OK", { status: 200 });
  }

  void applyNormalizedWebhookEvent(event).catch((e) =>
    console.error("[MisticPay] WEBHOOK PROCESS ERROR:", e)
  );

  return new Response("OK", { status: 200 });
}
