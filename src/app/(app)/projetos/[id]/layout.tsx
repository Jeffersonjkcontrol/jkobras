import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Contact, FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { sessaoOrg } from "@/lib/sessao";
import { podeEditar } from "@/lib/permissoes";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { ProjetoForm } from "@/components/forms/projeto-form";
import { ProjetoTabs } from "@/components/projeto-tabs";
import { atualizarProjeto, excluirProjeto } from "@/app/actions/projetos";
import { statusCalculadoProjeto, STATUS_LABEL, STATUS_TONE } from "@/lib/projetos";

export default async function ProjetoLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const s = await sessaoOrg();
  const org = s.organizacaoId;
  const editavel = podeEditar(s.papel);

  const [projeto, clientes, responsaveis] = await Promise.all([
    prisma.projeto.findFirst({
      where: { id, organizacaoId: org },
      include: {
        cliente: { select: { id: true, nome: true } },
        etapas: { select: { progresso: true, inicioPrev: true, fimPrev: true, fimReal: true } },
      },
    }),
    prisma.cliente.findMany({ where: { organizacaoId: org }, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
    prisma.user.findMany({ where: { ativo: true, organizacaoId: org }, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
  ]);
  if (!projeto) notFound();

  const status = statusCalculadoProjeto(projeto.status, projeto.dataInicioPrev, projeto.dataFimPrev, projeto.etapas);

  return (
    <div className="space-y-5">
      <Link href="/projetos" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">{projeto.titulo}</h1>
            <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted">
            <Link href={`/clientes/${projeto.cliente.id}`} className="inline-flex items-center gap-1 hover:text-primary">
              <Contact className="h-4 w-4" /> {projeto.cliente.nome}
            </Link>{" "}
            · {projeto.tipo}
          </p>
          {projeto.descricao && <p className="mt-1 text-sm text-muted">{projeto.descricao}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/relatorios/projeto/${projeto.id}`}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium hover:bg-surface-muted"
          >
            <FileText className="h-4 w-4" /> Relatório
          </Link>
          {editavel && (
            <Modal
              title="Editar projeto"
              trigger={
                <span className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium hover:bg-surface-muted">
                  <Pencil className="h-4 w-4" /> Editar
                </span>
              }
            >
              <ProjetoForm action={atualizarProjeto} projeto={projeto} clientes={clientes} responsaveis={responsaveis} />
            </Modal>
          )}
          {editavel && (
            <form action={excluirProjeto}>
              <input type="hidden" name="id" value={projeto.id} />
              <ConfirmSubmit confirmacao="Excluir este projeto e tudo dele (etapas, RDOs, orçamentos, financeiro, documentos)?" />
            </form>
          )}
        </div>
      </div>

      <ProjetoTabs id={projeto.id} />

      <div>{children}</div>
    </div>
  );
}
