import * as React from "react";
import { X, Bell, Ticket, Copy, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type NotificationCategory = "general" | "individual";

interface NotificationItem {
  id: number;
  category: NotificationCategory;
  type: string;
  title: string;
  text?: string;
  code?: string;
  time: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 1,
    category: "general",
    type: "promo",
    title: "Nova promoção disponível!",
    text: "Aproveite os novos produtos com cashback especial.",
    time: "10 min atrás",
    read: false,
  },
  {
    id: 2,
    category: "general",
    type: "bonus",
    title: "Código bônus disponível",
    code: "NEXUS2026",
    time: "1 hora atrás",
    read: false,
  },
  {
    id: 3,
    category: "individual",
    type: "withdraw",
    title: "Seu saque foi aprovado",
    text: "O valor já foi enviado para a sua chave Pix cadastrada.",
    time: "30 min atrás",
    read: false,
  },
  {
    id: 4,
    category: "individual",
    type: "pix",
    title: "Sua chave Pix foi validada com sucesso",
    time: "2 horas atrás",
    read: false,
  },
  {
    id: 5,
    category: "individual",
    type: "pix",
    title: "Problema identificado na sua chave Pix",
    text: "Verifique os dados cadastrados para evitar falhas no saque.",
    time: "5 horas atrás",
    read: false,
  },
];

const TABS: { key: NotificationCategory; label: string }[] = [
  { key: "general", label: "Gerais" },
  { key: "individual", label: "Individuais" },
];

export function NotificationDropdown({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<NotificationCategory>("general");
  const [notifications, setNotifications] = React.useState(MOCK_NOTIFICATIONS);

  const unreadCount = React.useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const readCount = React.useMemo(
    () => notifications.filter((n) => n.read).length,
    [notifications]
  );

  const handleOpen = (open: boolean) => {
    setIsOpen(open);
  };

  const markAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearRead = () => {
    setNotifications((prev) => prev.filter((n) => !n.read));
    toast.success("Notificações lidas removidas", {
      description: "Apenas as não lidas continuam na lista.",
    });
  };

  const filteredNotifications = React.useMemo(
    () => notifications.filter((n) => n.category === activeTab),
    [notifications, activeTab]
  );

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado!", {
      description: `Código ${code} copiado para sua área de transferência.`,
    });
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <button className="relative text-foreground/80 hover:text-primary transition-colors">
          {children}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-black animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0 bg-surface border border-border shadow-2xl rounded-2xl overflow-hidden mr-4" align="end" sideOffset={8}>
        <div className="p-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-3 w-3 text-primary" />
            <h3 className="text-[10px] font-black uppercase text-foreground">Notificações</h3>
          </div>
          <div className="flex items-center gap-1">
            {readCount > 0 && (
              <button
                onClick={clearRead}
                className="flex items-center gap-1 px-1.5 py-1 rounded text-[9px] font-bold text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
                title="Limpar lidas"
              >
                <Trash2 className="h-3 w-3" />
                <span>Limpar lidas</span>
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-background rounded-full transition-colors"
            >
              <X className="h-3 w-3 text-muted hover:text-foreground" />
            </button>
          </div>
        </div>

        <div className="flex border-b border-border">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex-1 py-2 text-[10px] font-bold uppercase transition-colors",
                activeTab === tab.key
                  ? "text-primary border-b-2 border-primary bg-background/30"
                  : "text-muted hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="max-h-72 overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <p className="p-4 text-center text-xs text-muted">Nenhuma notificação {activeTab === "general" ? "geral" : "individual"}.</p>
          ) : (
            filteredNotifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={cn(
                  "w-full text-left p-3 border-b border-border/50 transition-colors",
                  notif.read
                    ? "opacity-50 hover:bg-background/30"
                    : "hover:bg-background/50 bg-background/20"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={cn(
                        "text-[11px] leading-tight",
                        notif.read ? "font-medium text-muted" : "font-bold text-foreground"
                      )}>
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    {notif.text && (
                      <p className="mt-1 text-[9px] text-muted leading-snug text-left">{notif.text}</p>
                    )}
                    {notif.code && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          copyCode(notif.code!);
                        }}
                        className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-1 rounded bg-background border border-primary/20 text-[9px] font-black text-primary uppercase hover:bg-primary/10 transition-colors"
                      >
                        <Ticket className="h-2.5 w-2.5" />
                        {notif.code}
                        <Copy className="h-2 w-2 ml-1" />
                      </span>
                    )}
                  </div>
                  <span className="text-[8px] text-muted font-medium whitespace-nowrap">{notif.time}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
