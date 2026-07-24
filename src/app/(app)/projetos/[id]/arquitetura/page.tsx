import { notFound } from "next/navigation";
import { Plus, Pencil, Stamp, Clock, AlertTriangle, Receipt, CalendarClock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { sessaoOrg } from "@/lib/sessao";
import { podeEditar } from "@/lib/permissoes";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { AprovacaoForm } from "@/components/forms/aprovacao-form";
import { HorasForm } from "@/components/forms/horas-form";
import { criarAprovacao, atualizarAprovacao, excluirAprovacao } from "@/app/actions/aprovacoes";
import { criarApontamento, atualizarApontamento, excluirApontamento, gerarReceitaHonorarios } from "@/app/actions/horas";
import { formatarMoeda, formatarData, cn } from "@/lib/utils";
import { STATUS_APROVACAO_LABEL, STATUS_APROVACAO_TONE, aprovacaoVencida } from "@/lib/arquitetura";

export default async function ProjetoArquiteturaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await sessaoOrg();
  const org = s.organizacaoId;
  const editavel = podeEditar(s.papel);

  const projeto = await prisma.projeto.findFirst({ where: { id, organizacaoId: org }, select: { id: true } });
  if (!projeto) notFound();

  const [aprovacoes, apontamentos, fases, pessoas] = await Promise.all([
    prisma.aprovacao.findMany({
      where: { projetoId: id, organizacaoId: org },
      orderBy: [{ status: "asc" }, { criadoEm: "asc" }],
      include: { responsavel: { select: { nome: true } } },
    }),
    prisma.apontamentoHoras.findMany({
      where: { projetoId: id, organizacaoId: org },
      orderBy: { data: "desc" },
      include: { user: { select: { nome: true } }, etapa: { select: { nome: true } } },
    }),
    prisma.etapaProjeto.findMany({
      where: { projetoId: id, organizacaoId: org },
      orderBy: { ordem: "asc" },
      select: { id: true, nome: true },
    }),
    prisma.user.findMany({
      where: { organizacaoId: org, ativo: true },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    }),
  ]);

  const hoje = new Date();
  const vencidas = aprovacoes.filter((a) => aprovacaoVencida(a, hoje));
  const totalHoras = apontamentos.reduce((sum, a) => sum + a.horas, 0);
  const totalHonorarios = apontamentos.reduce((sum, a) => sum + a.horas * (a.valorHora ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* ---------------- Aprovações e licenças ---------------- */}
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Stamp className="h-5 w-5 text-primary" /> Aprovações e licenças
        </h2>
        {editavel && (
          <Modal
            title="Nova aprovação"
            trigger={<span className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"><Plus className="h-4 w-4" /> Nova aprovação</span>}
          >
            <AprovacaoForm action={criarAprovacao} projetoId={id} responsaveis={pessoas} />
          </Modal>
        )}
      </div>

      {vencidas.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
          <span>
            <strong>{vencidas.length}</strong> aprovação(ões) com prazo vencido e ainda sem decisão — verifique exigências pendentes.
          </span>
        </div>
      )}

      {aprovacoes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-surface p-6 text-center text-sm text-muted">
          Nenhum protocolo registrado. Cadastre aprovações de prefeitura, bombeiros e concessionárias para acompanhar prazos.
        </p>
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>O que</TH>
              <TH>Órgão</TH>
              <TH>Protocolo</TH>
              <TH>Prazo</TH>
              <TH>Responsável</TH>
              <TH>Situação</TH>
              {editavel && <TH className="text-right">Ações</TH>}
            </tr>
          </THead>
          <tbody>
            {aprovacoes.map((a) => {
              const vencida = aprovacaoVencida(a, hoje);
              return (
                <TR key={a.id}>
                  <TD className="font-medium">{a.descricao}</TD>
                  <TD className="text-muted">{a.orgao}</TD>
                  <TD className="text-muted">
                    {a.numeroProtocolo ?? "—"}
                    {a.dataProtocolo && <span className="block text-xs">{formatarData(a.dataProtocolo)}</span>}
                  </TD>
                  <TD className={cn("whitespace-nowrap", vencida ? "font-semibold text-danger" : "text-muted")}>
                    {a.prazo ? formatarData(a.prazo) : "—"}
                    {vencida && <span className="block text-xs">vencido</span>}
                  </TD>
                  <TD className="text-muted">{a.responsavel?.nome ?? "—"}</TD>
                  <TD><Badge tone={STATUS_APROVACAO_TONE[a.status]}>{STATUS_APROVACAO_LABEL[a.status]}</Badge></TD>
                  {editavel && (
                    <TD className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Modal title="Editar aprovação" trigger={<span className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-muted"><Pencil className="h-4 w-4" /></span>}>
                          <AprovacaoForm action={atualizarAprovacao} projetoId={id} responsaveis={pessoas} aprovacao={a} />
                        </Modal>
                        <form action={excluirAprovacao}>
                          <input type="hidden" name="id" value={a.id} />
                          <input type="hidden" name="projetoId" value={id} />
                          <ConfirmSubmit confirmacao="Excluir este protocolo?" />
                        </form>
                      </div>
                    </TD>
                  )}
                </TR>
              );
            })}
          </tbody>
        </Table>
      )}

      {/* ---------------- Horas e honorários ---------------- */}
      <div className="flex items-center justify-between pt-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Clock className="h-5 w-5 text-primary" /> Horas de projeto
        </h2>
        <div className="flex items-center gap-2">
          {editavel && totalHonorarios > 0 && (
            <form action={gerarReceitaHonorarios}>
              <input type="hidden" name="projetoId" value={id} />
              <Button type="submit" variant="outline" size="sm" title="Lançar honorários como receita no Financeiro">
                <Receipt className="mr-1 h-4 w-4" /> Lançar honorários
              </Button>
            </form>
          )}
          <Modal
            title="Apontar horas"
            trigger={<span className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"><Plus className="h-4 w-4" /> Apontar horas</span>}
          >
            <HorasForm action={criarApontamento} projetoId={id} fases={fases} pessoas={pessoas} podeEscolherPessoa={editavel} />
          </Modal>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card><CardContent><p className="flex items-center gap-1 text-sm text-muted"><Clock className="h-4 w-4" /> Total de horas</p><p className="mt-1 text-lg font-bold text-foreground">{totalHoras.toFixed(1)} h</p></CardContent></Card>
        <Card><CardContent><p className="flex items-center gap-1 text-sm text-muted"><Receipt className="h-4 w-4" /> Honorários acumulados</p><p className="mt-1 text-lg font-bold text-success">{formatarMoeda(totalHonorarios)}</p></CardContent></Card>
      </div>

      {apontamentos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-surface p-6 text-center text-sm text-muted">
          Nenhuma hora apontada. Registre as horas de projeto para calcular os honorários.
        </p>
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Data</TH>
              <TH>Quem</TH>
              <TH>Fase</TH>
              <TH>Descrição</TH>
              <TH className="text-right">Horas</TH>
              <TH className="text-right">Valor</TH>
              <TH className="text-right">Ações</TH>
            </tr>
          </THead>
          <tbody>
            {apontamentos.map((h) => {
              const meu = h.userId === s.userId;
              const podeMexer = editavel || meu;
              return (
                <TR key={h.id}>
                  <TD className="whitespace-nowrap text-muted">{formatarData(h.data)}</TD>
                  <TD>{h.user?.nome ?? "—"}</TD>
                  <TD className="text-muted">{h.etapa?.nome ?? "—"}</TD>
                  <TD className="text-muted">{h.descricao ?? "—"}</TD>
                  <TD className="text-right font-medium">{h.horas.toFixed(1)} h</TD>
                  <TD className="text-right">{h.valorHora != null ? formatarMoeda(h.horas * h.valorHora) : "—"}</TD>
                  <TD className="text-right">
                    {podeMexer && (
                      <div className="flex items-center justify-end gap-1">
                        <Modal title="Editar apontamento" trigger={<span className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-muted"><Pencil className="h-4 w-4" /></span>}>
                          <HorasForm action={atualizarApontamento} projetoId={id} fases={fases} pessoas={pessoas} podeEscolherPessoa={editavel} apontamento={h} />
                        </Modal>
                        <form action={excluirApontamento}>
                          <input type="hidden" name="id" value={h.id} />
                          <input type="hidden" name="projetoId" value={id} />
                          <ConfirmSubmit />
                        </form>
                      </div>
                    )}
                  </TD>
                </TR>
              );
            })}
          </tbody>
        </Table>
      )}

      <p className="flex items-center gap-1 text-xs text-muted">
        <CalendarClock className="h-3.5 w-3.5" />
        As fases vêm do cronograma do projeto — use “Aplicar fases de arquitetura” na Visão geral para criar as fases da NBR 13532.
      </p>
    </div>
  );
}
