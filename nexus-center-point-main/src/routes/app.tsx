import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { MissionFAB } from "@/components/MissionFAB";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const location = useLocation();
  const isHome = location.pathname === "/app" || location.pathname === "/app/";

  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <Header />
      <main className="mx-auto max-w-lg px-4">
        <Outlet />
      </main>
      <BottomNav />
      {isHome && <MissionFAB />}
    </div>
  );
}
