import { redirect } from "next/navigation";
import { CalendarX, Lock } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { sair } from "@/app/actions/auth";
import { motivoBloqueio } from "@/lib/tenant";
import { formatarData } from "@/lib/utils";

/** Tela mostrada quando o escritório está sem acesso (teste vencido ou conta desativada). */
export default async function ExpiradoPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.organizacaoId) redirect("/admin");

  const org = await prisma.organizacao.findUnique({
    where: { id: session.user.organizacaoId },
    select: { nome: true, ativa: true, trialAte: true },
  });
  const motivo = motivoBloqueio(org);
  // Se voltou a ter acesso (super-admin estendeu), segue para o app.
  if (!motivo) redirect("/");

  const expirouTeste = motivo === "TRIAL_EXPIRADO";
  const Icone = expirouTeste ? CalendarX : Lock;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-warning/15">
          <Icone className="h-7 w-7 text-warning" />
        </div>

        <h1 className="text-xl font-bold text-foreground">
          {expirouTeste ? "Período de teste encerrado" : "Acesso suspenso"}
        </h1>

        <p className="mt-2 text-sm text-muted">
          {expirouTeste ? (
            <>
              O período de avaliação do escritório <strong className="text-foreground">{org?.nome}</strong> terminou
              {org?.trialAte ? <> em {formatarData(org.trialAte)}</> : null}.
            </>
          ) : (
            <>
              O acesso do escritório <strong className="text-foreground">{org?.nome}</strong> está desativado no momento.
            </>
          )}
        </p>

        <p className="mt-3 text-sm text-muted">
          Seus dados continuam salvos. Fale com o administrador da plataforma para reativar o acesso.
        </p>

        <form action={sair} className="mt-6">
          <Button type="submit" variant="outline" className="w-full">Sair</Button>
        </form>
      </div>
    </div>
  );
}
