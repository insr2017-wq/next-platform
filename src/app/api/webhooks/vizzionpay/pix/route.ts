export async function GET() {
  return new Response("OK", { status: 200 });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  console.log("WEBHOOK PIX CHEGOU", JSON.stringify(body));

  void import("@/lib/vizzionpay-pix-webhook")
    .then((m) => m.processVizzionPayPixWebhook(body))
    .catch((e) => console.error("WEBHOOK PROCESS ERROR:", e));

  return new Response("OK", { status: 200 });
}
