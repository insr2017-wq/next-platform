"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { User, Lock, Eye, EyeOff, Phone, ShieldCheck, Gift, ArrowRight, RefreshCw, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { markSessionActive } from "@/components/auth/SessionGate";
import { normalizePhone } from "@/lib/phone-auth";

function generateCaptchaCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export function AuthPage({ initialMode = "login" }: { initialMode?: "login" | "register" }) {
  const [mode, setMode] = React.useState<"login" | "register">(initialMode);
  const [showPassword, setShowPassword] = React.useState(false);
  const [captchaCode, setCaptchaCode] = React.useState("");
  const [captchaInput, setCaptchaInput] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [invite, setInvite] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  React.useEffect(() => {
    const fromUrl = searchParams.get("invite")?.trim();
    if (fromUrl) {
      setInvite(fromUrl.toUpperCase());
      setMode("register");
    }
  }, [searchParams]);

  React.useEffect(() => {
    if (mode === "register") {
      setCaptchaCode(generateCaptchaCode());
      setCaptchaInput("");
    }
  }, [mode]);

  const switchMode = (next: "login" | "register") => {
    setMode(next);
    router.replace(next === "login" ? "/login" : "/register");
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (mode === "register") {
      if (captchaInput.trim() !== captchaCode) {
        toast.error("Código de verificação incorreto. Tente o novo código gerado.");
        setCaptchaCode(generateCaptchaCode());
        setCaptchaInput("");
        return;
      }
      if (fullName.trim().length < 2) {
        toast.error("Informe seu nome.");
        return;
      }
      const phoneDigits = normalizePhone(phone);
      if (phoneDigits.length < 10 || phoneDigits.length > 11) {
        toast.error("Informe um telefone válido (10 ou 11 dígitos).");
        return;
      }
      if (password.length < 6) {
        toast.error("A senha deve ter ao menos 6 caracteres.");
        return;
      }

      setLoading(true);
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: fullName.trim(),
            phone: phoneDigits,
            password,
            confirmPassword: password,
            inviteCode: invite.trim() || undefined,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(typeof data.error === "string" ? data.error : "Erro ao cadastrar.");
          return;
        }
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: phoneDigits, password }),
        });
        const loginData = await loginRes.json().catch(() => ({}));
        if (!loginRes.ok) {
          toast.success("Conta criada. Entre com seu telefone e senha.");
          switchMode("login");
          return;
        }
        markSessionActive();
        toast.success("Conta criada com sucesso!");
        window.location.assign(loginData.redirectTo ?? "/home");
      } catch {
        toast.error("Erro de conexão. Tente novamente.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (phone.trim().length < 8) {
      toast.error("Informe um telefone válido.");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter ao menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "Erro ao entrar.");
        return;
      }
      const to = data.redirectTo ?? (data.role === "admin" ? "/admin/dashboard" : "/home");
      markSessionActive();
      toast.success("Login realizado com sucesso!");
      window.location.assign(to);
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const isRegisterDisabled = mode === "register" && captchaInput.trim().length !== 4;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center overflow-x-hidden bg-background p-6">
      <div className="pointer-events-none absolute top-0 left-0 z-0 h-full w-full overflow-hidden opacity-20">
        <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute right-[-10%] bottom-[-10%] h-[40%] w-[40%] rounded-full bg-primary/10 blur-[100px]" />
      </div>

      <div className="z-10 flex w-full max-w-md flex-col items-center">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 flex flex-col items-center">
          <img
            src="/nexus-mark.png"
            alt="Nexus Tech"
            className="mb-3 h-20 w-auto object-contain drop-shadow-[0_0_25px_rgba(163,230,53,0.35)]"
          />
          <h1 className="text-3xl font-black tracking-tighter text-white">
            NEXUS <span className="text-primary">TECH</span>
          </h1>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: mode === "login" ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: mode === "login" ? 20 : -20 }}
            className="w-full"
          >
            <div className="mb-8 text-center">
              <h2 className="mb-2 text-2xl font-bold text-white">
                {mode === "login" ? "Bem-vindo de volta!" : "Crie sua conta"}
              </h2>
              <p className="text-sm text-muted">
                {mode === "login" ? "Entre para acessar sua conta" : "Junte-se a nós e comece a ganhar"}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {mode === "login" ? (
                <>
                  <div className="relative">
                    <Phone className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted" />
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Telefone"
                      className="h-14 rounded-2xl border-white/5 bg-surface pl-12 focus:border-primary/50"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Senha"
                      className="h-14 rounded-2xl border-white/5 bg-surface pr-12 pl-12 focus:border-primary/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-1/2 right-4 -translate-y-1/2 text-muted"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="remember" className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:text-black" />
                      <label htmlFor="remember" className="cursor-pointer text-sm text-muted">
                        Lembrar de mim
                      </label>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="relative">
                    <User className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted" />
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nome de usuário"
                      className="h-14 rounded-2xl border-white/5 bg-surface pl-12"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted" />
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Número de telefone"
                      className="h-14 rounded-2xl border-white/5 bg-surface pl-12"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Senha"
                      className="h-14 rounded-2xl border-white/5 bg-surface pr-12 pl-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-1/2 right-4 -translate-y-1/2 text-muted"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <div className="relative">
                    <Gift className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted" />
                    <Input
                      value={invite}
                      onChange={(e) => setInvite(e.target.value.toUpperCase())}
                      placeholder="Código de convite (se tiver)"
                      className="h-14 rounded-2xl border-white/5 bg-surface pl-12"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Shield className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted" />
                      <Input
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        value={captchaInput}
                        onChange={(e) => setCaptchaInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        placeholder="Digite os 4 números"
                        className="h-14 rounded-2xl border-white/5 bg-surface pl-11"
                      />
                    </div>
                    <div className="flex h-14 items-center gap-1 rounded-2xl border border-white/5 bg-surface px-3 select-none">
                      {captchaCode.split("").map((digit, index) => (
                        <span
                          key={index}
                          className={cn("text-base font-bold text-primary/90", index % 2 === 0 ? "rotate-1" : "-rotate-1")}
                        >
                          {digit}
                        </span>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setCaptchaCode(generateCaptchaCode());
                          setCaptchaInput("");
                        }}
                        className="ml-1.5 rounded-lg p-1 text-muted hover:text-primary"
                        aria-label="Atualizar código de verificação"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </>
              )}

              <Button
                type="submit"
                disabled={isRegisterDisabled || loading}
                className={cn(
                  "h-14 w-full rounded-2xl text-lg font-bold shadow-[0_4px_20px_rgba(163,230,53,0.3)]",
                  isRegisterDisabled || loading
                    ? "cursor-not-allowed bg-primary/40 text-black/60"
                    : "bg-primary text-black hover:bg-primary/90",
                )}
              >
                {loading ? "Aguarde…" : mode === "login" ? "Entrar" : "Cadastrar"}
              </Button>
            </form>
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex w-full items-center gap-4 rounded-2xl border border-white/5 bg-surface/50 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm leading-tight font-bold text-white">Sua conta 100% segura</p>
            <p className="text-xs text-muted">Seus dados protegidos com tecnologia de ponta.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => switchMode(mode === "login" ? "register" : "login")}
          className="mt-8 flex items-center gap-2 text-sm font-medium text-white hover:text-primary"
        >
          {mode === "login" ? "Ainda não tem conta?" : "Já possui uma conta?"}
          <span className="font-bold text-primary">{mode === "login" ? "Cadastre-se" : "Entrar"}</span>
          <ArrowRight className="h-4 w-4 text-primary" />
        </button>
      </div>
    </div>
  );
}
