"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Lock, Phone, Ticket, UserRound } from "lucide-react";
import { normalizePhone } from "@/lib/phone-auth";
import authBanner from "@/assets/auth-banner-shoei.png";

export function RegisterPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [invite, setInvite] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fromUrl = searchParams.get("invite")?.trim();
    if (fromUrl) setInvite(fromUrl.toUpperCase());
  }, [searchParams]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (name.trim().length < 2) return setError("Informe seu nome");
    const phoneDigits = normalizePhone(phone);
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      return setError("Informe um telefone válido (10 ou 11 dígitos)");
    }
    if (password.length < 6) return setError("A senha deve ter ao menos 6 caracteres");
    if (password !== confirm) return setError("As senhas não coincidem");

    let inviteCode = invite.trim();
    if (!inviteCode && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      inviteCode = (params.get("invite") ?? "").trim();
    }
    if (inviteCode) inviteCode = inviteCode.toUpperCase();

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: name.trim(),
          phone: phoneDigits,
          password,
          confirmPassword: confirm,
          inviteCode: inviteCode || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao cadastrar");
        return;
      }
      router.push("/login");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const field = "flex items-center gap-3 rounded-full border border-border bg-card px-4 py-3";
  const input = "w-full bg-transparent text-sm outline-hidden";

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background">
      <div className="flex h-40 w-full items-center justify-center bg-white px-8">
        <img
          src={authBanner.src}
          alt="SHOEI"
          width={authBanner.width}
          height={authBanner.height}
          className="max-h-24 w-full max-w-xs object-contain"
        />
      </div>
      <div className="px-6 py-6">
        <h1 className="text-2xl font-bold text-foreground">Criar conta</h1>
        <p className="mt-1 text-sm text-muted-foreground">Cadastre-se em menos de um minuto</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className={field}>
            <UserRound className="h-4 w-4 text-primary" />
            <input
              value={name}
              maxLength={60}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome completo"
              className={input}
            />
          </label>
          <label className={field}>
            <Phone className="h-4 w-4 text-primary" />
            <input
              type="tel"
              value={phone}
              maxLength={20}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Telefone"
              className={input}
            />
          </label>
          <label className={field}>
            <Lock className="h-4 w-4 text-primary" />
            <input
              type="password"
              value={password}
              maxLength={64}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              className={input}
            />
          </label>
          <label className={field}>
            <Lock className="h-4 w-4 text-primary" />
            <input
              type="password"
              value={confirm}
              maxLength={64}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirmar senha"
              className={input}
            />
          </label>
          <label className={field}>
            <Ticket className="h-4 w-4 text-primary" />
            <input
              value={invite}
              maxLength={20}
              onChange={(e) => setInvite(e.target.value)}
              placeholder="Código de convite (opcional)"
              className={input}
            />
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {loading ? "Cadastrando…" : "Cadastrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link href="/login" className="font-semibold text-primary">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
