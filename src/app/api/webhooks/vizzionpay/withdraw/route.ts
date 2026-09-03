export const dynamic = "force-dynamic";

export async function GET() {
  return new Response("OK", { status: 200 });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  void import("@/lib/vizzionpay-withdraw-webhook")
    .then((m) => m.processVizzionPayWithdrawWebhook(body))
    .catch((e) => console.error("[VizzionPay Saque] withdraw_webhook_process_error", e));

  return new Response("OK", { status: 200 });
}
