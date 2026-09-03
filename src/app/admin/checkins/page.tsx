import { EmptyState } from "@/components/admin/EmptyState";

export default function AdminCheckinsPage() {
  return (
    <div style={{ marginTop: 8 }}>
      <EmptyState message="Nenhum check-in registrado. Esta página está pronta para receber dados." />
    </div>
  );
}
