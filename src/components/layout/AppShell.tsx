"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/nexus/BottomNav";
import { Header } from "@/components/nexus/Header";
import { MissionFAB } from "@/components/nexus/MissionFAB";
import { SplashScreen } from "@/components/nexus/SplashScreen";

export function AppShell({
  children,
  userName,
}: {
  children: ReactNode;
  userName: string;
}) {
  const pathname = usePathname();
  const isHome = pathname === "/home";

  return (
    <div className="min-h-screen bg-background pt-16 pb-20">
      <SplashScreen />
      <Header userName={userName} />
      <main className="mx-auto max-w-lg px-4">{children}</main>
      <BottomNav />
      {isHome ? <MissionFAB /> : null}
    </div>
  );
}
