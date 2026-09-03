import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type User = {
  name: string;
  phone: string;
  password: string;
  code: string;
};

const KEY = "3rdcap_users";
const SESSION = "3rdcap_session";

function readUsers(): User[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

type AuthCtx = {
  user: User | null;
  ready: boolean;
  login: (phone: string, password: string) => { ok: boolean; error?: string };
  register: (name: string, phone: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const persist = (u: User | null) => {
    setUser(u);
    if (u) localStorage.setItem(SESSION, JSON.stringify(u));
    else localStorage.removeItem(SESSION);
  };

  const value: AuthCtx = {
    user,
    ready,
    login: (phone, password) => {
      const found = readUsers().find((u) => u.phone === phone && u.password === password);
      if (!found) return { ok: false, error: "Telefone ou senha incorretos" };
      persist(found);
      return { ok: true };
    },
    register: (name, phone, password) => {
      const users = readUsers();
      if (users.some((u) => u.phone === phone)) return { ok: false, error: "Telefone ja cadastrado" };
      const novo: User = {
        name,
        phone,
        password,
        code: String(Math.floor(10000000 + Math.random() * 89999999)),
      };
      users.push(novo);
      localStorage.setItem(KEY, JSON.stringify(users));
      persist(novo);
      return { ok: true };
    },
    logout: () => persist(null),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
