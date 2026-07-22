import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Pencil,
  CalendarRange,
  Ruler,
  Wallet,
  User2,
  Contact,
  CheckCircle2,
  Circle,
  ClipboardList,
  Camera,
  CloudSun,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { sessaoOrg } from "@/lib/sessao";
import { podeEditar } from "@/lib/permissoes";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { Gantt } from "@/components/gantt";
import { ProjetoForm } from "@/components/forms/projeto-form";
import { EtapaForm } from "@/components/forms/etapa-form";
import { SubEtapaForm } from "@/components/forms/subetapa-form";
import { RDOForm } from "@/components/forms/rdo-form";
import {
  atualizarProjeto,
  excluirProjeto,
  criarEtapa,
  atualizarEtapa,
  excluirEtapa,
  criarSubEtapa,
  atualizarSubEtapa,
  alternarSubEtapa,
  excluirSubEtapa,
} from "@/app/actions/projetos";
import { criarRDO, excluirRDO } from "@/app/actions/rdo";
import { formatarMoeda, formatarData, formatarDataHora } from "@/lib/utils";
import {
  statusCalculadoProjeto,
  statusCalculadoEtapa,
  etapaAtrasada,
  diasAtraso,
  STATUS_LABEL,
  STATUS_TONE,
  STATUS_SUBETAPA_LABEL,
  STATUS_SUBETAPA_TONE,
} from "@/lib/projetos";

const ITEM_RDO_TONE: Record<string, "success" | "warning" | "danger"> = {
  OK: "success",
  ATENCAO: "warning",
  PROBLEMA: "danger",
};
const ITEM_RDO_LABEL: Record<string, string> = { OK: "OK", ATENCAO: "Atenção", PROBLEMA: "Problema" };

export default async function ProjetoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await sessaoOrg();
  const org = s.organizacaoId;
  const editavel = podeEditar(s.papel);

  const [projeto, clientes, responsaveis] = await Promise.all([
    prisma.projeto.findFirst({
      where: { id, organizacaoId: org },
      include: {
        cliente: { select: { id: true, nome: true } },
        responsavel: { select: { nome: true } },
        etapas: { orderBy: { ordem: "asc" }, include: { subEtapas: { orderBy: { ordem: "asc" } } } },
        diarios: {
          orderBy: { data: "desc" },
          include: { itens: { orderBy: { ordem: "asc" } }, fotos: true, criadoPor: { select: { nome: true } } },
        },
      },
    }),
    prisma.cliente.findMany({ where: { organizacaoId: org }, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
    prisma.user.findMany({ where: { ativo: true, organizacaoId: org }, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
  ]);
  if (!projeto) notFound();

  const hoje = new Date();
  const status = statusCalculadoProjeto(projeto.status, projeto.dataInicioPrev, projeto.dataFimPrev, projeto.etapas, hoje);
  const atrasos = projeto.etapas.filter((e) => etapaAtrasada(e, hoje));

  return (
    <div className="space-y-6">
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
        {editavel && (
          <div className="flex items-center gap-2">
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
            <form action={excluirProjeto}>
              <input type="hidden" name="id" value={projeto.id} />
              <ConfirmSubmit confirmacao="Excluir este projeto e tudo dele (etapas, RDOs)?" />
            </form>
          </div>
        )}
      </div>

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
        <p className="rounded-xl border border-dashed border-border bg-surface p-6 text-center text-sm text-muted">Nenhuma etapa cadastrada.</p>
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
                          <SubEtapaForm action={criarSubEtapa} etapaId={e.id} projetoId={projeto.id} proximaOrdem={e.subEtapas.length + 1} />
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
                            <span className={`flex-1 text-sm ${concluida ? "text-muted line-through" : "text-foreground"}`}>{s.titulo}</span>
                            <Badge tone={STATUS_SUBETAPA_TONE[s.status]}>{STATUS_SUBETAPA_LABEL[s.status]}</Badge>
                            {editavel && (
                              <>
                                <Modal title="Editar sub-etapa" trigger={<span className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-muted"><Pencil className="h-4 w-4" /></span>}>
                                  <SubEtapaForm action={atualizarSubEtapa} sub={s} etapaId={e.id} projetoId={projeto.id} />
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

      {/* Diário de Obra (RDO) */}
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground"><ClipboardList className="h-5 w-5 text-primary" /> Diário de Obra (RDO)</h2>
        <Modal
          title="Novo RDO"
          trigger={<span className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"><Plus className="h-4 w-4" /> Novo RDO</span>}
        >
          <RDOForm action={criarRDO} projetoId={projeto.id} />
        </Modal>
      </div>

      {projeto.diarios.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-surface p-6 text-center text-sm text-muted">
          Nenhum registro ainda. Use “Novo RDO” no canteiro para registrar a situação do dia.
        </p>
      ) : (
        <div className="space-y-3">
          {projeto.diarios.map((r) => (
            <Card key={r.id}>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-semibold text-foreground">{formatarData(r.data)}</span>
                    {r.clima && <Badge tone="default"><CloudSun className="mr-1 h-3 w-3" />{r.clima}</Badge>}
                    {r.maoDeObra && <span className="text-muted">👷 {r.maoDeObra}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted">{r.criadoPor?.nome ?? ""} · {formatarDataHora(r.criadoEm)}</span>
                    <form action={excluirRDO}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="projetoId" value={projeto.id} />
                      <ConfirmSubmit confirmacao="Excluir este RDO?" />
                    </form>
                  </div>
                </div>

                {r.itens.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {r.itens.map((it) => (
                      <Badge key={it.id} tone={ITEM_RDO_TONE[it.status]}>{it.titulo}: {ITEM_RDO_LABEL[it.status]}</Badge>
                    ))}
                  </div>
                )}
                {r.atividades && <p className="text-sm text-foreground"><span className="text-muted">Atividades: </span>{r.atividades}</p>}
                {r.ocorrencias && <p className="text-sm text-foreground"><span className="text-muted">Ocorrências: </span>{r.ocorrencias}</p>}
                {r.fotos.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {r.fotos.map((f) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <a key={f.id} href={f.url} target="_blank" rel="noreferrer">
                        <img src={f.url} alt={f.legenda ?? "Foto da obra"} className="h-20 w-20 rounded-lg border border-border object-cover" />
                      </a>
                    ))}
                    <span className="flex items-center gap-1 self-end text-xs text-muted"><Camera className="h-3 w-3" />{r.fotos.length}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
