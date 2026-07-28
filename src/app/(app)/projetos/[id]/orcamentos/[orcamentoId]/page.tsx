import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Pencil, CalendarClock, FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { sessaoOrg } from "@/lib/sessao";
import { podeEditar } from "@/lib/permissoes";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { OrcamentoForm } from "@/components/forms/orcamento-form";
import { ItemOrcamentoForm } from "@/components/forms/item-orcamento-form";
import { SemPermissao } from "@/components/sem-permissao";
import {
  atualizarOrcamento,
  excluirOrcamento,
  alterarStatusOrcamento,
  adicionarItemOrcamento,
  atualizarItemOrcamento,
  excluirItemOrcamento,
} from "@/app/actions/orcamentos";
import { formatarMoeda } from "@/lib/utils";
import {
  subtotalItem,
  totalOrcamento,
  STATUS_ORCAMENTO,
  STATUS_ORCAMENTO_LABEL,
  STATUS_ORCAMENTO_TONE,
} from "@/lib/orcamentos";

export default async function OrcamentoDetalhePage({ params }: { params: Promise<{ id: string; orcamentoId: string }> }) {
  const { id, orcamentoId } = await params;
  const s = await sessaoOrg();
  const org = s.organizacaoId;
  const editavel = podeEditar(s.papel);

  // Área sensível: exige permissão de visualização.
  if (!s.perm.orcamentos) return <SemPermissao area="os orçamentos deste projeto" />;

  const orcamento = await prisma.orcamento.findFirst({
    where: { id: orcamentoId, organizacaoId: org, projetoId: id },
    include: { itens: { orderBy: { ordem: "asc" } } },
  });
  if (!orcamento) notFound();

  const total = totalOrcamento(orcamento.itens);

  return (
    <div className="space-y-5">
      <Link href={`/projetos/${id}/orcamentos`} className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Orçamentos
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-foreground">{orcamento.titulo}</h2>
            <Badge tone={STATUS_ORCAMENTO_TONE[orcamento.status]}>{STATUS_ORCAMENTO_LABEL[orcamento.status]}</Badge>
          </div>
          {orcamento.validadeDias != null && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted">
              <CalendarClock className="h-3.5 w-3.5" /> Validade: {orcamento.validadeDias} dias
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/relatorios/orcamento/${orcamento.id}`}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium hover:bg-surface-muted"
          >
            <FileText className="h-4 w-4" /> Proposta / PDF
          </Link>
          {editavel && (
            <form action={alterarStatusOrcamento} className="flex items-center gap-1">
              <input type="hidden" name="id" value={orcamento.id} />
              <Select name="status" defaultValue={orcamento.status} className="h-10 w-40">
                {STATUS_ORCAMENTO.map((st) => (
                  <option key={st} value={st}>{STATUS_ORCAMENTO_LABEL[st]}</option>
                ))}
              </Select>
              <Button type="submit" variant="outline" size="sm">Atualizar</Button>
            </form>
          )}
          {editavel && (
            <Modal title="Editar orçamento" trigger={<span className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium hover:bg-surface-muted"><Pencil className="h-4 w-4" /> Editar</span>}>
              <OrcamentoForm action={atualizarOrcamento} orcamento={orcamento} projetoId={id} />
            </Modal>
          )}
          {editavel && (
            <form action={excluirOrcamento}>
              <input type="hidden" name="id" value={orcamento.id} />
              <input type="hidden" name="projetoId" value={id} />
              <ConfirmSubmit confirmacao="Excluir este orçamento e seus itens?" />
            </form>
          )}
        </div>
      </div>

      {/* Itens */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">Itens</h3>
        {editavel && (
          <Modal title="Novo item" trigger={<span className="inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-surface px-3 text-sm font-medium hover:bg-surface-muted"><Plus className="h-4 w-4" /> Item</span>}>
            <ItemOrcamentoForm action={adicionarItemOrcamento} orcamentoId={orcamento.id} proximaOrdem={orcamento.itens.length + 1} />
          </Modal>
        )}
      </div>

      {orcamento.itens.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-surface p-6 text-center text-sm text-muted">Nenhum item. Adicione linhas com quantidade × valor.</p>
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Descrição</TH>
              <TH className="text-center">Un.</TH>
              <TH className="text-right">Qtd</TH>
              <TH className="text-right">V. unit.</TH>
              <TH className="text-right">Subtotal</TH>
              {editavel && <TH className="text-right">Ações</TH>}
            </tr>
          </THead>
          <tbody>
            {orcamento.itens.map((it) => (
              <TR key={it.id}>
                <TD className="font-medium">{it.descricao}</TD>
                <TD className="text-center text-muted">{it.unidade}</TD>
                <TD className="text-right">{it.quantidade}</TD>
                <TD className="text-right">{formatarMoeda(it.valorUnitario)}</TD>
                <TD className="text-right font-semibold">{formatarMoeda(subtotalItem(it))}</TD>
                {editavel && (
                  <TD className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Modal title="Editar item" trigger={<span className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-muted"><Pencil className="h-4 w-4" /></span>}>
                        <ItemOrcamentoForm action={atualizarItemOrcamento} item={it} orcamentoId={orcamento.id} />
                      </Modal>
                      <form action={excluirItemOrcamento}>
                        <input type="hidden" name="id" value={it.id} />
                        <input type="hidden" name="orcamentoId" value={orcamento.id} />
                        <ConfirmSubmit />
                      </form>
                    </div>
                  </TD>
                )}
              </TR>
            ))}
            <TR className="bg-surface-muted/40">
              <TD className="font-semibold" colSpan={4}>Total</TD>
              <TD className="text-right text-base font-bold text-primary">{formatarMoeda(total)}</TD>
              {editavel && <TD />}
            </TR>
          </tbody>
        </Table>
      )}

      {orcamento.observacoes && (
        <Card>
          <CardContent>
            <p className="text-sm font-medium text-foreground">Observações</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{orcamento.observacoes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
