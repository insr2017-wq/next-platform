import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !user) navigate({ to: "/", replace: true });
  }, [ready, user, navigate]);

  if (!ready || !user) return <div className="min-h-screen bg-background" />;

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background pb-20">
      {children}
      <BottomNav />
    </div>
  );
}
