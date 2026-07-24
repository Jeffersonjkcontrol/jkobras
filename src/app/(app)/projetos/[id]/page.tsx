import { notFound } from "next/navigation";
import {
  Plus,
  Pencil,
  CalendarRange,
  Ruler,
  Wallet,
  User2,
  CheckCircle2,
  Circle,
  Stamp,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { sessaoOrg } from "@/lib/sessao";
import { podeEditar } from "@/lib/permissoes";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { Gantt } from "@/components/gantt";
import { EtapaForm } from "@/components/forms/etapa-form";
import { SubEtapaForm } from "@/components/forms/subetapa-form";
import { Button } from "@/components/ui/button";
import {
  criarEtapa,
  atualizarEtapa,
  excluirEtapa,
  criarSubEtapa,
  atualizarSubEtapa,
  alternarSubEtapa,
  excluirSubEtapa,
  aplicarFasesArquitetura,
} from "@/app/actions/projetos";
import { formatarMoeda, formatarData } from "@/lib/utils";
import {
  statusCalculadoEtapa,
  etapaAtrasada,
  diasAtraso,
  STATUS_LABEL,
  STATUS_TONE,
  STATUS_SUBETAPA_LABEL,
  STATUS_SUBETAPA_TONE,
} from "@/lib/projetos";

export default async function ProjetoVisaoGeralPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await sessaoOrg();
  const org = s.organizacaoId;
  const editavel = podeEditar(s.papel);

  const [projeto, profissionais] = await Promise.all([
    prisma.projeto.findFirst({
      where: { id, organizacaoId: org },
      include: {
        responsavel: { select: { nome: true } },
        etapas: {
          orderBy: { ordem: "asc" },
          include: {
            subEtapas: {
              orderBy: { ordem: "asc" },
              include: { responsavelProf: { select: { nome: true } } },
            },
          },
        },
      },
    }),
    prisma.profissional.findMany({
      where: { organizacaoId: org, ativo: true },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, funcao: true },
    }),
  ]);
  if (!projeto) notFound();

  const hoje = new Date();
  const atrasos = projeto.etapas.filter((e) => etapaAtrasada(e, hoje));

  return (
    <div className="space-y-6">
      {/* Info */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card><CardContent><p className="text-sm text-muted">Período</p><p className="mt-1 flex items-center gap-1 text-sm font-medium"><CalendarRange className="h-4 w-4 text-muted" />{formatarData(projeto.dataInicioPrev)}–{formatarData(projeto.dataFimPrev)}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-muted">Área</p><p className="mt-1 flex items-center gap-1 text-lg font-bold"><Ruler className="h-4 w-4 text-muted" />{projeto.areaM2 ? `${projeto.areaM2} m²` : "—"}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-muted">Valor do contrato</p><p className="mt-1 flex items-center gap-1 text-lg font-bold"><Wallet className="h-4 w-4 text-muted" />{formatarMoeda(projeto.valorContrato)}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-muted">Responsável</p><p className="mt-1 flex items-center gap-1 text-sm font-medium"><User2 className="h-4 w-4 text-muted" />{projeto.responsavel?.nome ?? "—"}</p></CardContent></Card>
      </div>

      {/* Cronograma */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Cronograma</h2>
        <Gantt etapas={projeto.etapas} />
      </div>

      {/* Etapas */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Etapas{atrasos.length > 0 && <span className="ml-2 text-sm font-normal text-danger">{atrasos.length} atrasada(s)</span>}</h2>
        {editavel && (
          <Modal
            title="Nova etapa"
            trigger={<span className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"><Plus className="h-4 w-4" /> Nova etapa</span>}
          >
            <EtapaForm action={criarEtapa} projetoId={projeto.id} proximaOrdem={projeto.etapas.length + 1} />
          </Modal>
        )}
      </div>

      {projeto.etapas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-6 text-center">
          <p className="text-sm text-muted">Nenhuma etapa cadastrada.</p>
          {editavel && (
            <form action={aplicarFasesArquitetura} className="mt-3">
              <input type="hidden" name="projetoId" value={projeto.id} />
              <Button type="submit" variant="outline">
                <Stamp className="mr-2 h-4 w-4" /> Aplicar fases de arquitetura (NBR 13532)
              </Button>
              <p className="mt-2 text-xs text-muted">
                Cria Levantamento, Estudo preliminar, Anteprojeto, Projeto legal, Executivo e Detalhamento, já encadeados a partir do início previsto.
              </p>
            </form>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {projeto.etapas.map((e) => {
            const atrasada = etapaAtrasada(e, hoje);
            const stEtapa = statusCalculadoEtapa(e, hoje);
            const temSubs = e.subEtapas.length > 0;
            const feitas = e.subEtapas.filter((s) => s.status === "CONCLUIDA").length;
            return (
              <Card key={e.id}>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-foreground">{e.nome}</span>
                        <Badge tone={STATUS_TONE[stEtapa]}>{STATUS_LABEL[stEtapa]}{atrasada ? ` +${diasAtraso(e, hoje)}d` : ""}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted">{formatarData(e.inicioPrev)}–{formatarData(e.fimPrev)}{temSubs ? ` · ${feitas}/${e.subEtapas.length} sub-etapas` : ""}</p>
                    </div>
                    {editavel && (
                      <div className="flex items-center gap-1">
                        <Modal title="Nova sub-etapa" trigger={<span className="inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-surface px-3 text-sm font-medium hover:bg-surface-muted"><Plus className="h-4 w-4" /> Sub-etapa</span>}>
                          <SubEtapaForm action={criarSubEtapa} etapaId={e.id} projetoId={projeto.id} proximaOrdem={e.subEtapas.length + 1} profissionais={profissionais} />
                        </Modal>
                        <Modal title="Editar etapa" trigger={<span className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-surface-muted"><Pencil className="h-4 w-4" /></span>}>
                          <EtapaForm action={atualizarEtapa} etapa={e} projetoId={projeto.id} temSubEtapas={temSubs} />
                        </Modal>
                        <form action={excluirEtapa}>
                          <input type="hidden" name="projetoId" value={projeto.id} />
                          <input type="hidden" name="id" value={e.id} />
                          <ConfirmSubmit />
                        </form>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-surface-muted">
                      <div className={atrasada ? "h-full bg-danger" : "h-full bg-primary"} style={{ width: `${e.progresso}%` }} />
                    </div>
                    <span className="text-xs text-muted">{e.progresso}%</span>
                  </div>

                  {temSubs && (
                    <ul className="divide-y divide-border border-t border-border">
                      {e.subEtapas.map((s) => {
                        const concluida = s.status === "CONCLUIDA";
                        return (
                          <li key={s.id} className="flex items-center gap-2 py-2">
                            {editavel ? (
                              <form action={alternarSubEtapa}>
                                <input type="hidden" name="id" value={s.id} />
                                <input type="hidden" name="projetoId" value={projeto.id} />
                                <button type="submit" title={concluida ? "Reabrir" : "Concluir"} className="flex h-6 w-6 items-center justify-center text-muted hover:text-primary">
                                  {concluida ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5" />}
                                </button>
                              </form>
                            ) : concluida ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-muted" />}
                            <span className={`flex-1 text-sm ${concluida ? "text-muted line-through" : "text-foreground"}`}>
                              {s.titulo}
                              {s.responsavelProf && <span className="ml-2 text-xs text-muted">· {s.responsavelProf.nome}</span>}
                            </span>
                            <Badge tone={STATUS_SUBETAPA_TONE[s.status]}>{STATUS_SUBETAPA_LABEL[s.status]}</Badge>
                            {editavel && (
                              <>
                                <Modal title="Editar sub-etapa" trigger={<span className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-muted"><Pencil className="h-4 w-4" /></span>}>
                                  <SubEtapaForm action={atualizarSubEtapa} sub={s} etapaId={e.id} projetoId={projeto.id} profissionais={profissionais} />
                                </Modal>
                                <form action={excluirSubEtapa}>
                                  <input type="hidden" name="id" value={s.id} />
                                  <input type="hidden" name="projetoId" value={projeto.id} />
                                  <ConfirmSubmit />
                                </form>
                              </>
                            )}
                          </li>
                        );
                      })}
                    </ul>
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
