"use client";

import * as React from "react";
import { X, Bell, Ticket, Copy, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type NotificationCategory = "general" | "individual";

export type AppNotification = {
  id: string;
  category: NotificationCategory;
  title: string;
  text?: string;
  code?: string;
  time: string;
  read: boolean;
};

export function NotificationDropdown({
  children,
  items = [],
}: {
  children: React.ReactNode;
  items?: AppNotification[];
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<NotificationCategory>("general");
  const [notifications, setNotifications] = React.useState<AppNotification[]>(items);

  React.useEffect(() => {
    setNotifications(items);
  }, [items]);

  React.useEffect(() => {
    if (items.length > 0) return;
    let cancelled = false;
    fetch("/api/user/notifications", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !Array.isArray(data.items)) return;
        setNotifications(data.items);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [items.length]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const readCount = notifications.filter((n) => n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearRead = () => {
    setNotifications((prev) => prev.filter((n) => !n.read));
    toast.success("Notificações lidas removidas");
  };

  const filtered = notifications.filter((n) => n.category === activeTab);

  const copyCode = (code: string) => {
    void navigator.clipboard.writeText(code);
    toast.success("Código copiado!");
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="relative text-foreground/80 transition-colors hover:text-primary">
          {children}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 animate-pulse items-center justify-center rounded-full bg-primary text-[10px] font-bold text-black">
              {unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="mr-4 w-[280px] overflow-hidden rounded-2xl border border-border bg-surface p-0 shadow-2xl"
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between border-b border-border p-3">
          <div className="flex items-center gap-2">
            <Bell className="h-3 w-3 text-primary" />
            <h3 className="text-[10px] font-black uppercase text-foreground">Notificações</h3>
          </div>
          <div className="flex items-center gap-1">
            {readCount > 0 && (
              <button
                type="button"
                onClick={clearRead}
                className="flex items-center gap-1 rounded px-1.5 py-1 text-[9px] font-bold text-muted hover:bg-red-400/10 hover:text-red-400"
              >
                <Trash2 className="h-3 w-3" />
                Limpar lidas
              </button>
            )}
            <button type="button" onClick={() => setIsOpen(false)} className="rounded-full p-1 hover:bg-background">
              <X className="h-3 w-3 text-muted hover:text-foreground" />
            </button>
          </div>
        </div>

        <div className="flex border-b border-border">
          {(
            [
              { key: "general", label: "Gerais" },
              { key: "individual", label: "Individuais" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex-1 py-2 text-[10px] font-bold uppercase transition-colors",
                activeTab === tab.key
                  ? "border-b-2 border-primary bg-background/30 text-primary"
                  : "text-muted hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="max-h-72 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="p-4 text-center text-xs text-muted">
              Nenhuma notificação {activeTab === "general" ? "geral" : "individual"}.
            </p>
          ) : (
            filtered.map((notif) => (
              <button
                key={notif.id}
                type="button"
                onClick={() => markAsRead(notif.id)}
                className={cn(
                  "w-full border-b border-border/50 p-3 text-left transition-colors",
                  notif.read ? "opacity-50 hover:bg-background/30" : "bg-background/20 hover:bg-background/50",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p
                        className={cn(
                          "text-[11px] leading-tight",
                          notif.read ? "font-medium text-muted" : "font-bold text-foreground",
                        )}
                      >
                        {notif.title}
                      </p>
                      {!notif.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                    </div>
                    {notif.text ? <p className="mt-1 text-left text-[9px] leading-snug text-muted">{notif.text}</p> : null}
                    {notif.code ? (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          copyCode(notif.code!);
                        }}
                        className="mt-1.5 inline-flex items-center gap-1.5 rounded border border-primary/20 bg-background px-2 py-1 text-[9px] font-black uppercase text-primary"
                      >
                        <Ticket className="h-2.5 w-2.5" />
                        {notif.code}
                        <Copy className="ml-1 h-2 w-2" />
                      </span>
                    ) : null}
                  </div>
                  <span className="whitespace-nowrap text-[8px] font-medium text-muted">{notif.time}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
