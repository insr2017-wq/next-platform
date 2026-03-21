import { prisma } from "@/lib/db";
import { EmptyState } from "@/components/admin/EmptyState";
import { AdminUsersManager, type AdminUserRow } from "@/components/admin/AdminUsersManager";
import {
  ensureUserBannedColumnSqlite,
  ensureUserPublicIdColumnAndBackfill,
  ensureUserPixColumnsSqlite,
  ensureUserCheckInColumnsSqlite,
} from "@/lib/user-schema-sqlite";

function normalizePhone(q: string): string {
  return q.replace(/\D/g, "");
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; page?: string | string[] }>;
}) {
  const sp = await searchParams;
  const qRaw = (sp?.q ?? "").trim();
  const qDigits = normalizePhone(qRaw);
  const pageSize = 30;
  const pageParam =
    typeof sp?.page === "string"
      ? sp.page
      : Array.isArray(sp?.page)
        ? sp.page[0]
        : undefined;
  const requestedPage = pageParam ? Number(pageParam) : 1;
  const page = Number.isFinite(requestedPage) && requestedPage >= 1 ? Math.floor(requestedPage) : 1;

  let rows: AdminUserRow[] = [];
  try {
    await ensureUserBannedColumnSqlite();
    await ensureUserPublicIdColumnAndBackfill();
    await ensureUserPixColumnsSqlite();
    await ensureUserCheckInColumnsSqlite();
    const publicIdCandidates = qRaw
      ? Array.from(
          new Set([qRaw, qRaw.toLowerCase(), qRaw.toUpperCase()].filter((v) => v && v.trim() !== "")),
        )
      : [];

    const orFilters: Array<{ phone: { contains: string } } | { publicId: { contains: string } }> = [];

    if (qDigits) {
      orFilters.push({ phone: { contains: qDigits } });
    }
    for (const candidate of publicIdCandidates) {
      orFilters.push({ publicId: { contains: candidate } });
    }

    const where = qRaw ? { OR: orFilters } : undefined;
    const totalCount = await prisma.user.count({ where });
    const totalPages = totalCount > 0 ? Math.ceil(totalCount / pageSize) : 1;
    const safePage = Math.min(page, totalPages);

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        publicId: true,
        phone: true,
        role: true,
        balance: true,
        banned: true,
        createdAt: true,
      },
    });
    rows = users.map((u) => ({
      id: u.id,
      publicId: u.publicId ?? "",
      phone: u.phone ?? "",
      role: u.role ?? "user",
      balance: Number(u.balance ?? 0),
      banned: Boolean(u.banned),
      createdAt: u.createdAt.toISOString(),
    }));

    const hasSearch = qRaw.length > 0;

    if (totalCount === 0) {
      return (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: "grid", gap: 12 }}>
            <form method="GET" style={{ marginBottom: 6 }}>
              <input
                name="q"
                placeholder="Buscar por telefone ou ID"
                defaultValue={qRaw}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  fontSize: 14,
                  fontWeight: 700,
                  outline: "none",
                }}
              />
            </form>
            <EmptyState message={hasSearch ? "Nenhum resultado encontrado" : "Nenhum usuário cadastrado."} />
          </div>
        </div>
      );
    }

    const from = (safePage - 1) * pageSize + 1;
    const to = Math.min(from + pageSize - 1, totalCount);

    const paginationHref = (p: number) => {
      const params = new URLSearchParams();
      if (qRaw) params.set("q", qRaw);
      params.set("page", String(p));
      return `/admin/users?${params.toString()}`;
    };

    const totalPagesClamped = totalPages;
    const currentPage = safePage;

    const pages: Array<number | "…"> = [];
    if (totalPagesClamped <= 7) {
      for (let i = 1; i <= totalPagesClamped; i++) pages.push(i);
    } else {
      const windowStart = Math.max(1, currentPage - 1);
      const windowEnd = Math.min(totalPagesClamped, currentPage + 1);
      pages.push(1);
      if (windowStart > 2) pages.push("…");
      for (let i = windowStart; i <= windowEnd; i++) {
        if (i !== 1 && i !== totalPagesClamped) pages.push(i);
      }
      if (windowEnd < totalPagesClamped - 1) pages.push("…");
      pages.push(totalPagesClamped);
    }

    return (
      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        <form method="GET" style={{ marginTop: 2 }}>
          <input
            name="q"
            placeholder="Buscar por telefone ou ID"
            defaultValue={qRaw}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              fontSize: 14,
              fontWeight: 700,
              outline: "none",
            }}
          />
        </form>

        <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 700 }}>
          Mostrando {from}-{to} de {totalCount} usuários
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          {currentPage > 1 ? (
            <a
              href={paginationHref(currentPage - 1)}
              style={{
                display: "inline-block",
                padding: "8px 10px",
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                fontSize: 13,
                fontWeight: 900,
                color: "var(--text)",
              }}
            >
              Anterior
            </a>
          ) : null}

          {pages.map((p, idx) =>
            p === "…" ? (
              <span key={`ellipsis-${idx}`} style={{ color: "#6b7280", fontWeight: 900 }}>
                …
              </span>
            ) : (
              <a
                key={p}
                href={paginationHref(p)}
                aria-current={p === currentPage ? "page" : undefined}
                style={{
                  display: "inline-block",
                  padding: "8px 10px",
                  borderRadius: 12,
                  border: p === currentPage ? "1px solid var(--brand)" : "1px solid var(--border)",
                  background: p === currentPage ? "var(--brand-light)" : "var(--surface)",
                  fontSize: 13,
                  fontWeight: 900,
                  color: p === currentPage ? "var(--brand)" : "var(--text)",
                  textDecoration: "none",
                }}
              >
                Página {p}
              </a>
            ),
          )}

          {currentPage < totalPagesClamped ? (
            <a
              href={paginationHref(currentPage + 1)}
              style={{
                display: "inline-block",
                padding: "8px 10px",
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                fontSize: 13,
                fontWeight: 900,
                color: "var(--text)",
              }}
            >
              Próxima
            </a>
          ) : null}
        </div>

        <AdminUsersManager users={rows} />
      </div>
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[admin/users] Falha ao listar usuários:", e);
    return (
      <div
        style={{
          marginTop: 12,
          padding: 16,
          borderRadius: 12,
          background: "#fef2f2",
          color: "#b91c1c",
        }}
      >
        <p style={{ margin: 0, fontWeight: 800 }}>Não foi possível carregar os usuários</p>
        <p style={{ margin: "10px 0 0", fontSize: 14, lineHeight: 1.5 }}>
          {process.env.NODE_ENV === "development" ? (
            <>
              <strong>Detalhe técnico:</strong> {message}
            </>
          ) : (
            <>
              Ocorreu um erro ao consultar o banco. Se o problema continuar, confira a conexão com o
              SQLite e execute <code>npx prisma db push</code> para alinhar o schema.
            </>
          )}
        </p>
      </div>
    );
  }
}
