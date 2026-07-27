import { redirect } from "next/navigation";
import { UserRound, LogOut } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/sidebar";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { PAPEL_LABEL, ehSuperAdmin } from "@/lib/permissoes";
import { orgBloqueada, diasRestantesTrial } from "@/lib/tenant";
import { sairSimulacao } from "@/app/actions/admin";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const superAdmin = ehSuperAdmin(session.user.papel);
  const impersonandoOrgId = session.user.impersonandoOrgId ?? null;

  // Super-admin usa /admin — a não ser que esteja SIMULANDO um escritório (suporte).
  if (superAdmin && !impersonandoOrgId) redirect("/admin");
  if (!superAdmin && !session.user.organizacaoId) redirect("/admin");

  const orgId = impersonandoOrgId ?? session.user.organizacaoId!;
  const org = await prisma.organizacao.findUnique({
    where: { id: orgId },
    select: { nome: true, logoData: true, ativa: true, trialAte: true },
  });
  // Conta bloqueada barra o tenant — mas o super-admin simulando passa (suporte).
  if (!impersonandoOrgId && orgBloqueada(org)) redirect("/expirado");

  const { name } = session.user;
  const papelEfetivo = impersonandoOrgId ? "ADMIN" : session.user.papel;
  const nome = org?.nome ?? "ArqObra";
  const diasTrial = impersonandoOrgId ? null : diasRestantesTrial(org?.trialAte);

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-surface lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          <BrandLogo logoData={org?.logoData} nome={nome} />
        </div>
        <Sidebar papel={papelEfetivo} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {impersonandoOrgId && (
          <div className="flex flex-wrap items-center justify-center gap-3 bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground">
            <span className="inline-flex items-center gap-1.5">
              <UserRound className="h-4 w-4" /> Você está vendo como <strong>{nome}</strong> (simulação de suporte)
            </span>
            <form action={sairSimulacao}>
              <button type="submit" className="inline-flex items-center gap-1 rounded-md bg-primary-foreground/20 px-2.5 py-1 text-xs font-semibold hover:bg-primary-foreground/30">
                <LogOut className="h-3.5 w-3.5" /> Sair da simulação
              </button>
            </form>
          </div>
        )}

        <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
          <div className="flex items-center gap-2 lg:hidden">
            <BrandLogo logoData={org?.logoData} nome={nome} />
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <UserMenu nome={name ?? "Usuário"} papelLabel={impersonandoOrgId ? "Super Admin (simulando)" : PAPEL_LABEL[papelEfetivo]} />
          </div>
        </header>

        <div className="border-b border-border bg-surface lg:hidden">
          <Sidebar papel={papelEfetivo} />
        </div>

        {diasTrial !== null && diasTrial <= 10 && (
          <div className="border-b border-warning/40 bg-warning/10 px-4 py-2 text-center text-sm text-foreground sm:px-6">
            {diasTrial <= 0
              ? "Seu período de teste termina hoje."
              : `Período de teste: faltam ${diasTrial} dia(s).`}{" "}
            Entre em contato para liberar o acesso definitivo.
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
