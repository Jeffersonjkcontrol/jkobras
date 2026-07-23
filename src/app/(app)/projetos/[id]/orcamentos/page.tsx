import { notFound } from "next/navigation";
import Link from "next/link";
import { Plus, Calculator, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { sessaoOrg } from "@/lib/sessao";
import { podeEditar } from "@/lib/permissoes";
import { EmptyState } from "@/components/ui/page-header";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { OrcamentoForm } from "@/components/forms/orcamento-form";
import { criarOrcamento } from "@/app/actions/orcamentos";
import { formatarMoeda, formatarData } from "@/lib/utils";
import { totalOrcamento, STATUS_ORCAMENTO_LABEL, STATUS_ORCAMENTO_TONE } from "@/lib/orcamentos";

export default async function OrcamentosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await sessaoOrg();
  const org = s.organizacaoId;
  const editavel = podeEditar(s.papel);

  const projeto = await prisma.projeto.findFirst({ where: { id, organizacaoId: org }, select: { id: true } });
  if (!projeto) notFound();

  const orcamentos = await prisma.orcamento.findMany({
    where: { projetoId: id, organizacaoId: org },
    orderBy: { criadoEm: "desc" },
    include: { itens: { select: { quantidade: true, valorUnitario: true } } },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Calculator className="h-5 w-5 text-primary" /> Orçamentos
        </h2>
        {editavel && (
          <Modal
            title="Novo orçamento"
            trigger={<span className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"><Plus className="h-4 w-4" /> Novo orçamento</span>}
          >
            <OrcamentoForm action={criarOrcamento} projetoId={id} />
          </Modal>
        )}
      </div>

      {orcamentos.length === 0 ? (
        <EmptyState titulo="Nenhum orçamento ainda" descricao="Crie uma proposta com itens (quantidade × valor) para este projeto." />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Proposta</TH>
              <TH>Status</TH>
              <TH className="text-right">Itens</TH>
              <TH className="text-right">Total</TH>
              <TH>Criado</TH>
              <TH className="text-right">Ação</TH>
            </tr>
          </THead>
          <tbody>
            {orcamentos.map((o) => (
              <TR key={o.id}>
                <TD className="font-medium">{o.titulo}</TD>
                <TD><Badge tone={STATUS_ORCAMENTO_TONE[o.status]}>{STATUS_ORCAMENTO_LABEL[o.status]}</Badge></TD>
                <TD className="text-right">{o.itens.length}</TD>
                <TD className="text-right font-semibold">{formatarMoeda(totalOrcamento(o.itens))}</TD>
                <TD className="text-muted">{formatarData(o.criadoEm)}</TD>
                <TD className="text-right">
                  <Link href={`/projetos/${id}/orcamentos/${o.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                    Abrir <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
