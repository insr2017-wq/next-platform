"use client";

import { Bell } from "lucide-react";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";

type HeaderProps = {
  userName: string;
};

export function Header({ userName }: HeaderProps) {
  const displayName = userName.trim() || "Usuário";
  const seed = encodeURIComponent(displayName);

  return (
    <header className="fixed top-0 right-0 left-0 z-50 flex h-16 items-center justify-between bg-background/80 px-4 backdrop-blur-lg">
      <div className="flex items-center gap-2">
        <img src="/nexus-mark.png" alt="Nexus Tech" className="h-8 w-auto object-contain" />
        <div className="flex flex-col leading-none">
          <span className="text-lg font-black tracking-tighter italic">NEXUS</span>
          <span className="-mt-0.5 ml-1 text-[8px] font-bold tracking-[0.2em] text-muted-foreground">T E C H</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <NotificationDropdown>
          <Bell className="h-6 w-6" />
        </NotificationDropdown>

        <div className="flex items-center gap-2 rounded-full border border-border bg-surface p-1 pr-3">
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`}
            alt={displayName}
            className="h-8 w-8 rounded-full bg-muted"
          />
          <div className="flex flex-col">
            <span className="max-w-[110px] truncate text-[10px] leading-tight font-bold">{displayName}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
