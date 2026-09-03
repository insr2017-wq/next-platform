import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { unlinkReferral } from "@/lib/admin-user-network";

function requireAdmin(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }
  return null;
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; invitedId: string }> }
) {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return denied;

  const { id, invitedId } = await context.params;
  if (!id || !invitedId) {
    return NextResponse.json({ error: "IDs inválidos." }, { status: 400 });
  }

  const result = await unlinkReferral(id, invitedId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: "Indicação desvinculada." });
}
