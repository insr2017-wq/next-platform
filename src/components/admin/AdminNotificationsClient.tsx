"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bell, Send } from "lucide-react";

const TEMPLATES = [
  { id: "withdraw", label: "Saque aprovado", title: "Seu saque foi aprovado", body: "O valor já foi enviado para a sua chave Pix cadastrada." },
  { id: "pix-ok", label: "Pix validada", title: "Sua chave Pix foi validada", body: "Você já pode solicitar saques normalmente." },
  { id: "pix-warn", label: "Problema na Pix", title: "Problema identificado na sua chave Pix", body: "Verifique os dados cadastrados para evitar falhas no saque." },
  { id: "bonus", label: "Código bônus", title: "Novo código bônus disponível", body: "Use o código abaixo para resgatar seu bônus.", code: "" },
  { id: "mission", label: "Nova missão", title: "Nova missão disponível", body: "Entre em Missões para cumprir o desafio e resgatar a recompensa." },
  { id: "promo", label: "Promoção", title: "Nova promoção disponível", body: "Aproveite as condições especiais nos produtos desta semana." },
];

type SentItem = {
  id: string;
  title: string;
  body: string;
  category: string;
  code: string | null;
  createdAt: string;
  target: string;
};

export function AdminNotificationsClient() {
  const [mode, setMode] = useState<"all" | "user">("all");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [code, setCode] = useState("");
  const [target, setTarget] = useState("");
  const [sending, setSending] = useState(false);
  const [items, setItems] = useState<SentItem[]>([]);

  const load = async () => {
    const res = await fetch("/api/admin/notifications", { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (res.ok && Array.isArray(data.items)) setItems(data.items);
  };

  useEffect(() => {
    void load();
  }, []);

  const applyTemplate = (id: string) => {
    const t = TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    setTitle(t.title);
    setBody(t.body);
    setCode(t.code ?? "");
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, code, mode, target }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Falha ao enviar.");
        return;
      }
      toast.success(data.message ?? "Enviado.");
      setTitle("");
      setBody("");
      setCode("");
      setTarget("");
      await load();
    } catch {
      toast.error("Erro de conexão.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Bell size={18} />
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Notificações</h2>
      </div>
      <p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>
        Escolha um modelo, ajuste o texto e envie para todos ou para um usuário.
      </p>

      <div>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#6b7280", marginBottom: 8, textTransform: "uppercase" }}>
          Biblioteca de mensagens
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => applyTemplate(t.id)}
              style={{
                textAlign: "left",
                padding: 10,
                borderRadius: 12,
                border: title === t.title ? "2px solid #111" : "1px solid #e5e7eb",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 800 }}>{t.label}</div>
              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{t.title}</div>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={(e) => void send(e)} style={{ display: "grid", gap: 12, background: "#fff", padding: 16, borderRadius: 12, border: "1px solid #e5e7eb" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <button type="button" onClick={() => setMode("all")} style={{ padding: 10, borderRadius: 10, border: mode === "all" ? "2px solid #111" : "1px solid #e5e7eb", fontWeight: 800 }}>
            Geral / broadcast
          </button>
          <button type="button" onClick={() => setMode("user")} style={{ padding: 10, borderRadius: 10, border: mode === "user" ? "2px solid #111" : "1px solid #e5e7eb", fontWeight: 800 }}>
            Individual
          </button>
        </div>
        {mode === "user" ? (
          <input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="Telefone ou ID público do usuário"
            style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
          />
        ) : null}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título"
          required
          style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Mensagem"
          rows={4}
          style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
        />
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Código bônus (opcional)"
          style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
        />
        <button
          type="submit"
          disabled={sending}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 12, borderRadius: 12, background: "#111", color: "#fff", fontWeight: 800, border: 0 }}
        >
          <Send size={16} />
          {sending ? "Enviando…" : "Enviar notificação"}
        </button>
      </form>

      <div style={{ display: "grid", gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>Enviadas recentemente</h3>
        {items.length === 0 ? (
          <p style={{ color: "#6b7280", fontSize: 13 }}>Nenhuma notificação enviada ainda.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
              <div style={{ fontWeight: 800 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>{item.body}</div>
              <div style={{ marginTop: 6, fontSize: 11, color: "#9ca3af" }}>
                {item.category === "individual" ? "Individual" : "Geral"} · {item.target} · {item.createdAt}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
