import { Bell } from "lucide-react";
import { NotificationDropdown } from "./notifications/NotificationDropdown";
import nexusMark from "@/assets/nexus-mark.png.asset.json";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between bg-background/80 px-4 backdrop-blur-lg">
      <div className="flex items-center gap-2">
        <img
          src={nexusMark.url}
          alt="Nexus Tech"
          className="h-8 w-auto object-contain"
        />
        <div className="flex flex-col leading-none">
          <span className="text-lg font-black tracking-tighter italic">NEXUS</span>
          <span className="text-[8px] tracking-[0.2em] text-muted-foreground font-bold ml-1 -mt-0.5">T E C H</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <NotificationDropdown>
          <Bell className="h-6 w-6" />
        </NotificationDropdown>
        
        <div className="flex items-center gap-2 rounded-full bg-surface p-1 pr-3 border border-border">
          <img 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas" 
            alt="User" 
            className="h-8 w-8 rounded-full bg-muted"
          />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold leading-tight">Lucas Martins</span>
          </div>
        </div>
      </div>
    </header>
  );
}
