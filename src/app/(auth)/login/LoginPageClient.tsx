"use client";

import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock, Phone } from "lucide-react";
import { markSessionActive } from "@/components/auth/SessionGate";
import authBanner from "@/assets/auth-banner-shoei.png";

declare global {
  interface Window {
    __turnstileToken?: string;
    onTurnstileSuccess?: (token: string) => void;
  }
}

export function LoginPageClient() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (phone.trim().length < 8) {
      setError("Informe um telefone válido");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter ao menos 6 caracteres");
      return;
    }

    const turnstileToken = window.__turnstileToken;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          password,
          turnstileToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao entrar");
        window.__turnstileToken = undefined;
        return;
      }

      const to =
        data.redirectTo ?? (data.role === "admin" ? "/admin/dashboard" : "/home");
      markSessionActive();
      if (data.role === "admin" || to.startsWith("/admin")) {
        window.location.assign(to);
        return;
      }
      router.push(to);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background">
      <div className="flex h-44 w-full items-center justify-center bg-white px-8">
        <img
          src={authBanner.src}
          alt="SHOEI"
          width={authBanner.width}
          height={authBanner.height}
          className="max-h-24 w-full max-w-xs object-contain"
        />
      </div>
      <div className="px-6 py-8">
        <h1 className="text-2xl font-bold text-foreground">Bem-vindo de volta</h1>
        <p className="mt-1 text-sm text-muted-foreground">Entre para acessar sua conta</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="flex items-center gap-3 rounded-full border border-border bg-card px-4 py-3">
            <Phone className="h-4 w-4 text-primary" />
            <input
              type="tel"
              value={phone}
              maxLength={20}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Telefone"
              className="w-full bg-transparent text-sm outline-hidden"
            />
          </label>
          <label className="flex items-center gap-3 rounded-full border border-border bg-card px-4 py-3">
            <Lock className="h-4 w-4 text-primary" />
            <input
              type="password"
              value={password}
              maxLength={64}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              className="w-full bg-transparent text-sm outline-hidden"
            />
          </label>

          <div
            className="cf-turnstile flex justify-center"
            data-sitekey="0x4AAAAAAEIM3JfkQzO7tvRK"
            data-callback="onTurnstileSuccess"
          />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >{loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Não tem conta?{" "}
          <Link href="/register" className="font-semibold text-primary">
            Cadastre-se
          </Link>
        </p>
      </div>

      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      <Script id="turnstile-callback" strategy="beforeInteractive">
        {`window.onTurnstileSuccess = function(token) { window.__turnstileToken = token; };`}
      </Script>
    </div>
  );
}
