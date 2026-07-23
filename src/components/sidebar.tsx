"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, HardHat, Users, Users2, Contact, Settings, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Papel } from "@prisma/client";

type Item = { href: string; label: string; icon: LucideIcon; somenteAdmin?: boolean };

const itens: Item[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projetos", label: "Projetos", icon: HardHat },
  { href: "/clientes", label: "Clientes", icon: Contact },
  { href: "/equipe", label: "Equipe", icon: Users },
  { href: "/usuarios", label: "Usuários", icon: Users2, somenteAdmin: true },
  { href: "/configuracoes", label: "Configurações", icon: Settings, somenteAdmin: true },
];

export function Sidebar({ papel }: { papel: Papel }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 p-3">
      {itens
        .filter((i) => (i.somenteAdmin ? papel === "ADMIN" : true))
        .map((item) => {
          const ativo = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                ativo
                  ? "bg-primary text-primary-foreground"
                  : "text-muted hover:bg-surface-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
    </nav>
  );
}
