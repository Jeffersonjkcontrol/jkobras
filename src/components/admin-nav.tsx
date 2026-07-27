"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

/** Navegação do painel do super-admin (Escritórios | Uso). */
export function AdminNav() {
  const pathname = usePathname();
  const ehUso = pathname.startsWith("/admin/uso");

  const itens = [
    { href: "/admin", label: "Escritórios", icon: Building2, ativo: !ehUso },
    { href: "/admin/uso", label: "Uso", icon: Activity, ativo: ehUso },
  ];

  return (
    <nav className="flex items-center gap-1">
      {itens.map(({ href, label, icon: Icon, ativo }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            ativo ? "bg-primary/10 text-primary" : "text-muted hover:text-foreground"
          )}
        >
          <Icon className="h-4 w-4" /> {label}
        </Link>
      ))}
    </nav>
  );
}
