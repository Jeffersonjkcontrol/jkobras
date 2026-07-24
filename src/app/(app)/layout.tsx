import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/sidebar";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { PAPEL_LABEL, ehSuperAdmin } from "@/lib/permissoes";
import { orgBloqueada, diasRestantesTrial } from "@/lib/tenant";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  // Super-admin (dono da plataforma) usa o painel /admin, não as telas do tenant.
  if (ehSuperAdmin(session.user.papel) || !session.user.organizacaoId) redirect("/admin");

  const { name, papel } = session.user;
  const org = await prisma.organizacao.findUnique({
    where: { id: session.user.organizacaoId },
    select: { nome: true, logoData: true, ativa: true, trialAte: true },
  });
  // Conta desativada ou período de teste vencido: nenhuma tela do tenant é acessível.
  if (orgBloqueada(org)) redirect("/expirado");

  const nome = org?.nome ?? "JK Obras";
  const diasTrial = diasRestantesTrial(org?.trialAte);

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-surface lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          <BrandLogo logoData={org?.logoData} nome={nome} />
        </div>
        <Sidebar papel={papel} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
          <div className="flex items-center gap-2 lg:hidden">
            <BrandLogo logoData={org?.logoData} nome={nome} />
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <UserMenu nome={name ?? "Usuário"} papelLabel={PAPEL_LABEL[papel]} />
          </div>
        </header>

        <div className="border-b border-border bg-surface lg:hidden">
          <Sidebar papel={papel} />
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
