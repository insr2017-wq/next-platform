"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function NexusBackHeader({ title, backHref = "/home" }: { title: string; backHref?: string }) {
  const router = useRouter();
  return (
    <div className="mb-2 flex items-center gap-4">
      <button
        type="button"
        onClick={() => router.push(backHref)}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-primary transition-transform active:scale-90"
        aria-label="Voltar"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <h1 className="text-xl font-black tracking-tight uppercase">{title}</h1>
    </div>
  );
}
