import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

type SubPageLayoutProps = {
  title: string;
  backHref?: string;
  children: ReactNode;
};

export function SubPageLayout({ title, backHref = "/home", children }: SubPageLayoutProps) {
  return (
    <div className="space-y-6 pt-4 pb-8">
      <div className="flex items-center gap-4">
        <Link
          href={backHref}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-primary"
          aria-label="Voltar"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-black tracking-tight uppercase">{title}</h1>
      </div>
      <div>{children}</div>
    </div>
  );
}
