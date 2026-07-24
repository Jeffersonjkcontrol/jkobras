"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutList, Users, Calculator, Wallet, FolderOpen, ClipboardList, Stamp, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Aba = { href: string; label: string; icon: LucideIcon; exato?: boolean };

export function ProjetoTabs({ id }: { id: string }) {
  const pathname = usePathname();
  const base = `/projetos/${id}`;
  const abas: Aba[] = [
    { href: base, label: "Visão geral", icon: LayoutList, exato: true },
    { href: `${base}/arquitetura`, label: "Arquitetura", icon: Stamp },
    { href: `${base}/equipe`, label: "Equipe", icon: Users },
    { href: `${base}/orcamentos`, label: "Orçamentos", icon: Calculator },
    { href: `${base}/financeiro`, label: "Financeiro", icon: Wallet },
    { href: `${base}/documentos`, label: "Documentos", icon: FolderOpen },
    { href: `${base}/rdo`, label: "Diário (RDO)", icon: ClipboardList },
  ];

  return (
    <nav className="-mb-px flex gap-1 overflow-x-auto border-b border-border">
      {abas.map((a) => {
        const ativo = a.exato ? pathname === a.href : pathname.startsWith(a.href);
        const Icon = a.icon;
        return (
          <Link
            key={a.href}
            href={a.href}
            className={cn(
              "flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors",
              ativo
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {a.label}
          </Link>
        );
      })}
    </nav>
  );
}
