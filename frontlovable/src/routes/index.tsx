import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, Phone } from "lucide-react";
import { useAuth } from "@/lib/auth";
import bannerHero from "@/assets/banner-hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Entrar — 3rd Cap | Capacetes e Rendimentos" },
      { name: "description", content: "Acesse sua conta 3rd Cap para acompanhar saldo, produtos e sua equipe." },
      { property: "og:title", content: "Entrar — 3rd Cap | Capacetes e Rendimentos" },
      { property: "og:description", content: "Acesse sua conta 3rd Cap para acompanhar saldo, produtos e sua equipe." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, user, ready } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && user) navigate({ to: "/dashboard", replace: true });
  }, [ready, user, navigate]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (phone.trim().length < 8) return setError("Informe um telefone válido");
    if (password.length < 6) return setError("A senha deve ter ao menos 6 caracteres");
    const res = login(phone.trim(), password);
    if (!res.ok) return setError(res.error ?? "Erro ao entrar");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background">
      <img src={bannerHero} alt="Motociclista com capacete" width={1200} height={600} className="h-44 w-full object-cover" />
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

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button type="submit" className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground">
            Entrar
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Não tem conta?{" "}
          <Link to="/cadastro" className="font-semibold text-primary">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}
