import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import nexusMark from "@/assets/nexus-mark.png.asset.json";
import { Share, PlusSquare, MonitorSmartphone } from "lucide-react";

interface InstallAppModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isIOS: boolean;
}

export function InstallAppModal({ open, onOpenChange, isIOS }: InstallAppModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[340px] rounded-2xl border-border bg-surface p-5">
        <DialogHeader className="items-center space-y-3">
          <img src={nexusMark.url} alt="Nexus Tech" className="h-12 w-12 object-contain" />
          <DialogTitle className="text-center text-sm font-black uppercase tracking-widest">
            Instalar Nexus Tech
          </DialogTitle>
        </DialogHeader>

        {isIOS ? (
          <div className="space-y-3">
            <p className="text-center text-xs text-muted">
              No iPhone, a instalação é feita pelo Safari em dois passos:
            </p>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
              <Share size={18} className="shrink-0 text-primary" />
              <p className="text-xs text-foreground">
                1. Toque em <span className="font-bold">Compartilhar</span> na barra do Safari
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
              <PlusSquare size={18} className="shrink-0 text-primary" />
              <p className="text-xs text-foreground">
                2. Escolha <span className="font-bold">“Adicionar à Tela de Início”</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
              <MonitorSmartphone size={18} className="shrink-0 text-primary" />
              <p className="text-xs text-foreground">
                Abra o menu do navegador e toque em{" "}
                <span className="font-bold">“Instalar aplicativo”</span> ou{" "}
                <span className="font-bold">“Adicionar à tela inicial”</span>.
              </p>
            </div>
            <p className="text-center text-[10px] text-muted">
              O app abre em tela cheia, com o ícone da Nexus Tech no seu celular.
            </p>
          </div>
        )}

        <button
          onClick={() => onOpenChange(false)}
          className="mt-1 w-full rounded-xl bg-primary py-3 text-xs font-black uppercase tracking-widest text-primary-foreground"
        >
          Entendi
        </button>
      </DialogContent>
    </Dialog>
  );
}
