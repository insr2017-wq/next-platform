import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { gatewayManager } from "@/lib/gateways/manager";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const availableGateways = gatewayManager.listRegisteredGatewayIds();
  const activeGateway = await gatewayManager.getActiveGatewayId();
  return NextResponse.json({ availableGateways, activeGateway });
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const activeGateway =
    typeof (body as { activeGateway?: unknown })?.activeGateway === "string"
      ? (body as { activeGateway: string }).activeGateway.trim()
      : "";

  if (!activeGateway) {
    return NextResponse.json({ error: "Informe o gateway ativo." }, { status: 400 });
  }

  if (!gatewayManager.isRegistered(activeGateway)) {
    return NextResponse.json(
      {
        error: "Gateway inválido.",
        availableGateways: gatewayManager.listRegisteredGatewayIds(),
      },
      { status: 400 }
    );
  }

  try {
    await gatewayManager.setActiveGateway(activeGateway);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "GATEWAY_NOT_REGISTERED") {
      return NextResponse.json({ error: "Gateway inválido." }, { status: 400 });
    }
    console.error("PUT admin/gateways/settings:", e);
    return NextResponse.json({ error: "Não foi possível salvar o gateway." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    availableGateways: gatewayManager.listRegisteredGatewayIds(),
    activeGateway,
  });
}
