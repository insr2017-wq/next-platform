import { processVizzionPayPixWebhook } from "@/lib/vizzionpay-pix-webhook";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return new Response("OK", { status: 200 });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  console.log("WEBHOOK RECEIVED:", body);

  try {
    await processVizzionPayPixWebhook(body);
  } catch (e) {
    console.error("WEBHOOK PROCESS ERROR:", e);
  }

  return new Response("OK", { status: 200 });
}
