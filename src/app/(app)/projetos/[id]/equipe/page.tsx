import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Users,
  Pencil,
  UserPlus,
  CheckCircle2,
  Circle,
  Receipt,
  CalendarClock,
  HardHat,
  Wallet,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { sessaoOrg } from "@/lib/sessao";
import { podeEditar } from "@/lib/permissoes";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { AlocacaoForm } from "@/components/forms/alocacao-form";
import { TarefaForm } from "@/components/forms/tarefa-form";
import {
  alocarProfissional,
  atualizarAlocacao,
  desalocarProfissional,
  criarTarefa,
  atualizarTarefa,
  alternarTarefa,
  excluirTarefa,
  gerarDespesaMaoDeObra,
} from "@/app/actions/equipe";
import { formatarMoeda, formatarData, cn } from "@/lib/utils";
import { formatarCusto, STATUS_TAREFA_LABEL, STATUS_TAREFA_TONE } from "@/lib/equipe";

export default async function ProjetoEquipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await sessaoOrg();
  const org = s.organizacaoId;
  const editavel = podeEditar(s.papel);

  const projeto = await prisma.projeto.findFirst({ where: { id, organizacaoId: org }, select: { id: true } });
  if (!projeto) notFound();

  const [alocacoes, tarefas, profissionais, maoDeObraLancada] = await Promise.all([
    prisma.alocacaoProjeto.findMany({
      where: { projetoId: id, organizacaoId: org },
      orderBy: { criadoEm: "asc" },
      include: { profissional: { select: { id: true, nome: true, funcao: true, telefone: true } } },
    }),
    prisma.tarefaProfissional.findMany({
      where: { projetoId: id, organizacaoId: org },
      orderBy: [{ status: "asc" }, { criadoEm: "asc" }],
      include: { profissional: { select: { id: true, nome: true, funcao: true } } },
    }),
    prisma.profissional.findMany({
      where: { organizacaoId: org, ativo: true },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, funcao: true, tipoCusto: true, custoValor: true },
    }),
    prisma.lancamentoFinanceiro.aggregate({
      where: { projetoId: id, organizacaoId: org, categoria: "Mão de obra", status: "REALIZADO" },
      _sum: { valor: true },
    }),
  ]);

  const verCustos = s.perm.custosEquipe;
  const alocadosIds = new Set(alocacoes.map((a) => a.profissionalId));
  const disponiveis = profissionais.filter((p) => !alocadosIds.has(p.id));
  const equipeDaObra = alocacoes.map((a) => ({ id: a.profissional.id, nome: a.profissional.nome, funcao: a.profissional.funcao }));

  const custoEmpreitadas = alocacoes
    .filter((a) => a.tipoCusto === "EMPREITADA")
    .reduce((sum, a) => sum + (a.custoValor ?? 0), 0);
  const custoTarefas = tarefas.reduce((sum, t) => sum + (t.custo ?? 0), 0);
  const lancado = maoDeObraLancada._sum.valor ?? 0;

  const semProfissionais = profissionais.length === 0;

  return (
    <div className="space-y-6">
      {/* Resumo — os cartões de custo só para quem tem permissão */}
      <div className={cn("grid grid-cols-1 gap-4", verCustos ? "sm:grid-cols-3" : "")}>
        <Card><CardContent><p className="flex items-center gap-1 text-sm text-muted"><Users className="h-4 w-4" /> Profissionais na obra</p><p className="mt-1 text-lg font-bold text-foreground">{alocacoes.length}</p></CardContent></Card>
        {verCustos && (
          <>
            <Card><CardContent><p className="flex items-center gap-1 text-sm text-muted"><HardHat className="h-4 w-4" /> Custo fechado (empreitadas + tarefas)</p><p className="mt-1 text-lg font-bold text-foreground">{formatarMoeda(custoEmpreitadas + custoTarefas)}</p></CardContent></Card>
            <Card><CardContent><p className="flex items-center gap-1 text-sm text-muted"><Wallet className="h-4 w-4" /> Mão de obra lançada (financeiro)</p><p className="mt-1 text-lg font-bold text-danger">{formatarMoeda(lancado)}</p></CardContent></Card>
          </>
        )}
      </div>

      {/* Alocações */}
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground"><Users className="h-5 w-5 text-primary" /> Equipe da obra</h2>
        {editavel && !semProfissionais && (
          <Modal
            title="Alocar profissional"
            trigger={<span className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"><UserPlus className="h-4 w-4" /> Alocar</span>}
          >
            <AlocacaoForm action={alocarProfissional} projetoId={id} profissionais={disponiveis} />
          </Modal>
        )}
      </div>

      {semProfissionais ? (
        <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-foreground">
          Cadastre profissionais em <Link href="/equipe" className="font-medium text-primary hover:underline">Equipe</Link> antes de alocá-los à obra.
        </div>
      ) : alocacoes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-surface p-6 text-center text-sm text-muted">Ninguém alocado ainda. Use “Alocar” para adicionar a equipe desta obra.</p>
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Profissional</TH>
              <TH>Função na obra</TH>
              {verCustos && <TH className="text-right">Custo acordado</TH>}
              {editavel && <TH className="text-right">Ações</TH>}
            </tr>
          </THead>
          <tbody>
            {alocacoes.map((a) => (
              <TR key={a.id}>
                <TD className="font-medium">
                  <Link href={`/equipe/${a.profissional.id}`} className="hover:text-primary">{a.profissional.nome}</Link>
                  {verCustos && a.profissional.telefone && <span className="ml-2 text-xs text-muted">{a.profissional.telefone}</span>}
                </TD>
                <TD className="text-muted">{a.funcaoNaObra ?? a.profissional.funcao}</TD>
                {verCustos && <TD className="text-right whitespace-nowrap">{formatarCusto(a.tipoCusto, a.custoValor)}</TD>}
                {editavel && (
                  <TD className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {verCustos && a.custoValor != null && a.tipoCusto === "EMPREITADA" && (
                        <form action={gerarDespesaMaoDeObra}>
                          <input type="hidden" name="projetoId" value={id} />
                          <input type="hidden" name="descricao" value={`Mão de obra: ${a.profissional.nome} (${a.funcaoNaObra ?? a.profissional.funcao})`} />
                          <input type="hidden" name="valor" value={a.custoValor} />
                          <Button type="submit" variant="outline" size="sm" title="Gerar despesa no financeiro"><Receipt className="h-4 w-4" /></Button>
                        </form>
                      )}
                      <Modal title="Editar alocação" trigger={<span className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-muted"><Pencil className="h-4 w-4" /></span>}>
                        <AlocacaoForm
                          action={atualizarAlocacao}
                          projetoId={id}
                          profissionais={disponiveis}
                          alocacao={{
                            id: a.id,
                            profissionalId: a.profissionalId,
                            profissionalNome: a.profissional.nome,
                            funcaoNaObra: a.funcaoNaObra,
                            tipoCusto: a.tipoCusto,
                            custoValor: a.custoValor,
                            observacoes: a.observacoes,
                          }}
                        />
                      </Modal>
                      <form action={desalocarProfissional}>
                        <input type="hidden" name="id" value={a.id} />
                        <input type="hidden" name="projetoId" value={id} />
                        <ConfirmSubmit confirmacao="Remover este profissional da obra?" />
                      </form>
                    </div>
                  </TD>
                )}
              </TR>
            ))}
          </tbody>
        </Table>
      )}

      {/* Tarefas */}
      <div className="flex items-center justify-between pt-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground"><CalendarClock className="h-5 w-5 text-primary" /> Tarefas da equipe</h2>
        {editavel && (
          <Modal
            title="Nova tarefa"
            trigger={<span className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"><Plus className="h-4 w-4" /> Nova tarefa</span>}
          >
            <TarefaForm action={criarTarefa} projetoId={id} profissionais={equipeDaObra} />
          </Modal>
        )}
      </div>

      {tarefas.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-surface p-6 text-center text-sm text-muted">Nenhuma tarefa. Crie tarefas e atribua aos profissionais da obra.</p>
      ) : (
        <div className="space-y-2">
          {tarefas.map((t) => {
            const concluida = t.status === "CONCLUIDA";
            return (
              <Card key={t.id}>
                <CardContent className="flex flex-wrap items-center gap-3">
                  {editavel ? (
                    <form action={alternarTarefa}>
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="projetoId" value={id} />
                      <button type="submit" title={concluida ? "Reabrir" : "Concluir"} className="flex h-6 w-6 items-center justify-center text-muted hover:text-primary">
                        {concluida ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5" />}
                      </button>
                    </form>
                  ) : concluida ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-muted" />}

                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm font-medium", concluida ? "text-muted line-through" : "text-foreground")}>{t.titulo}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                      {t.profissional ? <span>{t.profissional.nome} · {t.profissional.funcao}</span> : <span>Sem responsável</span>}
                      {t.prazo && <span className="flex items-center gap-1"><CalendarClock className="h-3 w-3" /> {formatarData(t.prazo)}</span>}
                      {verCustos && t.custo != null && <span className="font-medium text-foreground">{formatarMoeda(t.custo)}</span>}
                    </p>
                  </div>

                  <Badge tone={STATUS_TAREFA_TONE[t.status]}>{STATUS_TAREFA_LABEL[t.status]}</Badge>

                  {editavel && (
                    <div className="flex items-center gap-1">
                      {verCustos && t.custo != null && (
                        <form action={gerarDespesaMaoDeObra}>
                          <input type="hidden" name="projetoId" value={id} />
                          <input type="hidden" name="descricao" value={`${t.titulo}${t.profissional ? ` — ${t.profissional.nome}` : ""}`} />
                          <input type="hidden" name="valor" value={t.custo} />
                          <Button type="submit" variant="outline" size="sm" title="Gerar despesa no financeiro"><Receipt className="h-4 w-4" /></Button>
                        </form>
                      )}
                      <Modal title="Editar tarefa" trigger={<span className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-muted"><Pencil className="h-4 w-4" /></span>}>
                        <TarefaForm
                          action={atualizarTarefa}
                          projetoId={id}
                          profissionais={equipeDaObra}
                          tarefa={{ id: t.id, titulo: t.titulo, descricao: t.descricao, profissionalId: t.profissionalId, status: t.status, prazo: t.prazo, custo: t.custo }}
                        />
                      </Modal>
                      <form action={excluirTarefa}>
                        <input type="hidden" name="id" value={t.id} />
                        <input type="hidden" name="projetoId" value={id} />
                        <ConfirmSubmit />
                      </form>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
