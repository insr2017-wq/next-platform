"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock, Eye, EyeOff } from "lucide-react";
import { NexusBackHeader } from "@/components/nexus/NexusBackHeader";

export function SecurityClient() {
  const router = useRouter();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      toast.error("Preencha todos os campos.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error("As novas senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Não foi possível alterar a senha.");
        return;
      }
      toast.success(data.message ?? "Senha atualizada com sucesso!");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      router.refresh();
    } catch {
      toast.error("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  const field = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    show: boolean,
    setShow: (v: boolean) => void,
    auto: string,
  ) => (
    <div className="space-y-1.5">
      <label className="ml-1 text-[10px] font-black text-muted uppercase">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={auto}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 pr-10 text-xs text-white outline-none focus:border-primary/50"
        />
        <button type="button" onClick={() => setShow(!show)} className="absolute top-1/2 right-3 -translate-y-1/2 text-muted">
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 px-1 pt-4 pb-28">
      <NexusBackHeader title="Segurança da Conta" backHref="/profile" />
      <div className="rounded-2xl border border-border bg-surface p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xs font-black uppercase">Trocar Senha</h2>
            <p className="text-[10px] text-muted uppercase">Atualize suas credenciais de acesso</p>
          </div>
        </div>
        <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
          {field("Senha atual", form.currentPassword, (v) => setForm({ ...form, currentPassword: v }), showCurrent, setShowCurrent, "current-password")}
          {field("Nova senha", form.newPassword, (v) => setForm({ ...form, newPassword: v }), showNew, setShowNew, "new-password")}
          {field("Confirmar nova senha", form.confirmPassword, (v) => setForm({ ...form, confirmPassword: v }), showConfirm, setShowConfirm, "new-password")}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary py-3 text-xs font-black text-black uppercase disabled:opacity-60"
          >
            {loading ? "Salvando…" : "Salvar senha"}
          </button>
        </form>
      </div>
    </div>
  );
}
