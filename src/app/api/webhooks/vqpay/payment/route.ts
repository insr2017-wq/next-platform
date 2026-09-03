import { processVqPayPaymentWebhook } from "@/lib/vqpay/vqpay-payment-webhook";

export async function GET() {
  return new Response("OK", { status: 200 });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("FAIL", { status: 400 });
  }

  console.log("WEBHOOK VQPAY PAYMENT", JSON.stringify(body));

  try {
    const result = await processVqPayPaymentWebhook(body);
    if (!result.ok) {
      console.warn("WEBHOOK VQPAY PAYMENT rejected:", result.reason);
      if (result.reason === "invalid_signature" || result.reason === "missing_signature") {
        return new Response("FAIL", { status: 403 });
      }
      if (result.reason === "deposit_not_found") {
        return new Response("FAIL", { status: 404 });
      }
      if (result.reason === "not_paid_yet") {
        return new Response("SUCCESS", { status: 200 });
      }
      return new Response("FAIL", { status: 400 });
    }
    return new Response("SUCCESS", { status: 200 });
  } catch (e) {
    console.error("WEBHOOK VQPAY PAYMENT ERROR:", e);
    return new Response("FAIL", { status: 500 });
  }
}
