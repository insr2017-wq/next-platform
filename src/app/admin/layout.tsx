import type { ReactNode } from "react";
import { AdminLayoutClient } from "@/components/admin/AdminLayoutClient";

/** Dados admin sempre no servidor em tempo real (evita lista vazia por HTML estático do build). */
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}

