import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Phone, Ticket, UserRound } from "lucide-react";
import { useAuth } from "@/lib/auth";
import bannerHero from "@/assets/banner-hero.jpg";

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Criar conta — 3rd Cap" },
      { name: "description", content: "Crie sua conta 3rd Cap e comece a acompanhar seus capacetes e rendimentos diários." },
      { property: "og:title", content: "Criar conta — 3rd Cap" },
      { property: "og:description", content: "Crie sua conta 3rd Cap e comece a acompanhar seus capacetes e rendimentos diários." },
    ],
  }),
  component: CadastroPage,
});

function CadastroPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [invite, setInvite] = useState("");
  const [error, setError] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (name.trim().length < 2) return setError("Informe seu nome");
    if (phone.trim().length < 8) return setError("Informe um telefone válido");
    if (password.length < 6) return setError("A senha deve ter ao menos 6 caracteres");
    if (password !== confirm) return setError("As senhas não coincidem");
    const res = register(name.trim(), phone.trim(), password);
    if (!res.ok) return setError(res.error ?? "Erro ao cadastrar");
    navigate({ to: "/dashboard" });
  };

  const field = "flex items-center gap-3 rounded-full border border-border bg-card px-4 py-3";
  const input = "w-full bg-transparent text-sm outline-hidden";

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background">
      <img src={bannerHero} alt="Motociclista com capacete" loading="lazy" width={1200} height={600} className="h-40 w-full object-cover" />
      <div className="px-6 py-6">
        <h1 className="text-2xl font-bold text-foreground">Criar conta</h1>
        <p className="mt-1 text-sm text-muted-foreground">Cadastre-se em menos de um minuto</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className={field}>
            <UserRound className="h-4 w-4 text-primary" />
            <input value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" className={input} />
          </label>
          <label className={field}>
            <Phone className="h-4 w-4 text-primary" />
            <input type="tel" value={phone} maxLength={20} onChange={(e) => setPhone(e.target.value)} placeholder="Telefone" className={input} />
          </label>
          <label className={field}>
            <Lock className="h-4 w-4 text-primary" />
            <input type="password" value={password} maxLength={64} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" className={input} />
          </label>
          <label className={field}>
            <Lock className="h-4 w-4 text-primary" />
            <input type="password" value={confirm} maxLength={64} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirmar senha" className={input} />
          </label>
          <label className={field}>
            <Ticket className="h-4 w-4 text-primary" />
            <input value={invite} maxLength={20} onChange={(e) => setInvite(e.target.value)} placeholder="Código de convite (opcional)" className={input} />
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button type="submit" className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground">
            Cadastrar
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link to="/" className="font-semibold text-primary">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
