"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Zap, ShieldCheck, Headphones, Calendar, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openExternalLink } from "@/lib/open-external-link";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  text?: string;
  link?: string;
  commissions?: {
    l1First: number;
    l1Next: number;
    l2: number;
    l3: number;
  };
}

export function WelcomeModal({ isOpen, onClose, title, text, link, commissions }: WelcomeModalProps) {
  const heading = (title ?? "").trim() || "Seja bem-vindo à";
  const body =
    (text ?? "").trim() ||
    "Aqui você encontra tecnologia de ponta, benefícios exclusivos e a oportunidade de ganhar mais.";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative max-h-[85vh] w-full max-w-[320px] overflow-y-auto rounded-[24px] border border-white/10 bg-[#0D1117] shadow-2xl sm:max-w-sm"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-white/60"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="flex flex-col items-center p-5 text-center sm:p-7">
              <img src="/nexus-mark.png" alt="Nexus Tech" className="mb-3 h-12 w-auto object-contain" />
              <h2 className="mb-1.5 text-lg leading-tight font-black tracking-tight text-white sm:text-xl">
                {heading} <br />
                <span className="text-primary italic">NEXUS TECH!</span>
              </h2>
              <p className="mb-4 max-w-[240px] text-[10px] leading-relaxed text-muted-foreground sm:text-xs">
                {body}
              </p>
              <div className="mb-4 w-full rounded-xl border border-white/5 bg-white/5 p-3 text-left">
                <div className="mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <h3 className="text-[11px] font-bold tracking-wider text-white uppercase">Comissões:</h3>
                </div>
                <ul className="space-y-1.5 pl-9">
                  <li className="text-[11px] text-white/80">
                    Nível 1:{" "}
                    <span className="ml-1 font-black text-primary">
                      {commissions?.l1First ?? 20}% no 1º aporte + {commissions?.l1Next ?? 8}% nos demais
                    </span>
                  </li>
                  <li className="text-[11px] text-white/80">
                    Nível 2: <span className="ml-1 font-black text-primary">{commissions?.l2 ?? 2}%</span>
                  </li>
                  <li className="text-[11px] text-white/80">
                    Nível 3: <span className="ml-1 font-black text-primary">{commissions?.l3 ?? 1}%</span>
                  </li>
                </ul>
              </div>
              <div className="mb-4 grid w-full grid-cols-2 gap-2">
                {[
                  { icon: Calendar, label: "Check-in" },
                  { icon: Zap, label: "Saques" },
                  { icon: ShieldCheck, label: "Seguro" },
                  { icon: Headphones, label: "Suporte" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/5 p-2">
                    <item.icon className="h-3.5 w-3.5 text-primary" />
                    <span className="truncate text-[10px] font-bold text-white/90">{item.label}</span>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                onClick={() => {
                  if (link?.trim()) openExternalLink(link, "Link do grupo ainda não configurado.");
                  onClose();
                }}
                className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-primary text-[10px] font-black tracking-widest text-black uppercase"
              >
                <Send className="h-3 w-3" />
                {link?.trim() ? "ENTRAR NO GRUPO" : "COMEÇAR"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
