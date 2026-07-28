import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  FolderOpen,
  // Alias obrigatório: "Map" do lucide sombrearia o Map nativo usado abaixo.
  Map as MapIcon,
  FileText,
  FileCheck2,
  Calculator,
  Image as ImageIcon,
  File as FileIcon,
  Download,
  Layers,
  History,
  Eye,
  EyeOff,
  Lock,
  LockOpen,
  type LucideIcon,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { sessaoOrg } from "@/lib/sessao";
import { podeEditar } from "@/lib/permissoes";
import { EmptyState } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { DocumentoForm } from "@/components/forms/documento-form";
import { criarDocumento, excluirDocumento } from "@/app/actions/documentos";
import { alternarVisibilidadeDocumento, alternarRestricaoDocumento } from "@/app/actions/portal";
import { urlDocumento } from "@/lib/arquivos";
import { formatarData, cn } from "@/lib/utils";
import { CATEGORIA_DOCUMENTO_LABEL, formatarTamanho, extensaoDe } from "@/lib/documentos";
import { DISCIPLINA_LABEL, proximaRevisao, ordemRevisaoDesc } from "@/lib/arquitetura";

const ICONE_CATEGORIA: Record<string, LucideIcon> = {
  PLANTA: MapIcon,
  CONTRATO: FileText,
  LICENCA: FileCheck2,
  ORCAMENTO: Calculator,
  FOTO: ImageIcon,
  OUTRO: FileIcon,
};

const IMAGENS = ["png", "jpg", "jpeg", "webp"];

type Doc = {
  id: string;
  nome: string;
  categoria: string;
  disciplina: string;
  prancha: string | null;
  revisao: string | null;
  url: string;
  tamanho: number;
  criadoEm: Date;
  visivelCliente: boolean;
  restrito: boolean;
  enviadoPor: { nome: string } | null;
};

function Miniatura({ doc }: { doc: Doc }) {
  const ext = extensaoDe(doc.url);
  const ehImagem = IMAGENS.includes(ext);
  const Icon = ICONE_CATEGORIA[doc.categoria] ?? FileIcon;
  return (
    <a href={urlDocumento(doc.id)} target="_blank" rel="noreferrer" className="block">
      {ehImagem ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={urlDocumento(doc.id)} alt={doc.nome} className="h-32 w-full border-b border-border object-cover" />
      ) : (
        <div className="flex h-32 flex-col items-center justify-center gap-2 border-b border-border bg-surface-muted/40">
          <Icon className="h-10 w-10 text-muted" />
          <span className="text-xs font-semibold uppercase text-muted">{ext || "arquivo"}</span>
        </div>
      )}
    </a>
  );
}

function BotoesDoc({ doc, projetoId, editavel }: { doc: Doc; projetoId: string; editavel: boolean }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <a href={urlDocumento(doc.id)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          <Download className="h-3.5 w-3.5" /> Abrir
        </a>
        {editavel && (
          <form action={excluirDocumento}>
            <input type="hidden" name="id" value={doc.id} />
            <input type="hidden" name="projetoId" value={projetoId} />
            <ConfirmSubmit confirmacao="Excluir este arquivo?" />
          </form>
        )}
      </div>

      {/* Sigilo interno: só quem tem permissão de documentos restritos enxerga. */}
      {editavel && (
        <form action={alternarRestricaoDocumento}>
          <input type="hidden" name="id" value={doc.id} />
          <input type="hidden" name="projetoId" value={projetoId} />
          <button
            type="submit"
            title={doc.restrito ? "Liberar para todos do escritório" : "Marcar como restrito (só quem tem permissão vê)"}
            className={cn(
              "inline-flex w-full items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors",
              doc.restrito
                ? "border-warning/40 bg-warning/10 text-warning hover:bg-warning/20"
                : "border-border text-muted hover:bg-surface-muted"
            )}
          >
            {doc.restrito ? <Lock className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}
            {doc.restrito ? "Restrito no escritório" : "Todos do escritório"}
          </button>
        </form>
      )}

      {/* Opt-in: o cliente só vê no portal o que for liberado aqui. */}
      {editavel && (
        <form action={alternarVisibilidadeDocumento}>
          <input type="hidden" name="id" value={doc.id} />
          <input type="hidden" name="projetoId" value={projetoId} />
          <button
            type="submit"
            title={doc.visivelCliente ? "Ocultar do portal do cliente" : "Liberar no portal do cliente"}
            className={cn(
              "inline-flex w-full items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors",
              doc.visivelCliente
                ? "border-success/40 bg-success/10 text-success hover:bg-success/20"
                : "border-border text-muted hover:bg-surface-muted"
            )}
          >
            {doc.visivelCliente ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {doc.visivelCliente ? "Visível ao cliente" : "Oculto do cliente"}
          </button>
        </form>
      )}
    </div>
  );
}

export default async function DocumentosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await sessaoOrg();
  const org = s.organizacaoId;
  const editavel = podeEditar(s.papel);

  const projeto = await prisma.projeto.findFirst({ where: { id, organizacaoId: org }, select: { id: true } });
  if (!projeto) notFound();

  // Quem não tem permissão simplesmente não recebe os documentos restritos.
  const documentos = await prisma.documento.findMany({
    where: {
      projetoId: id,
      organizacaoId: org,
      ...(s.perm.docsRestritos ? {} : { restrito: false }),
    },
    orderBy: { criadoEm: "desc" },
    include: { enviadoPor: { select: { nome: true } } },
  });

  // Pranchas: documentos com "prancha" preenchida são revisões do mesmo desenho.
  const pranchas = new Map<string, Doc[]>();
  const avulsos: Doc[] = [];
  for (const d of documentos) {
    if (d.prancha) {
      const lista = pranchas.get(d.prancha) ?? [];
      lista.push(d);
      pranchas.set(d.prancha, lista);
    } else {
      avulsos.push(d);
    }
  }
  // Dentro de cada prancha, da revisão mais nova para a mais antiga.
  for (const lista of pranchas.values()) {
    lista.sort((a, b) => {
      const r = ordemRevisaoDesc(a.revisao, b.revisao);
      return r !== 0 ? r : b.criadoEm.getTime() - a.criadoEm.getTime();
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <FolderOpen className="h-5 w-5 text-primary" /> Documentos / Plantas
        </h2>
        {editavel && (
          <Modal
            title="Enviar documento"
            trigger={<span className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"><Plus className="h-4 w-4" /> Enviar</span>}
          >
            <DocumentoForm action={criarDocumento} projetoId={id} />
          </Modal>
        )}
      </div>

      {documentos.length === 0 && (
        <EmptyState
          titulo="Nenhum documento"
          descricao="Envie plantas, contratos e licenças. Preencha o campo “prancha” para controlar as revisões (R00, R01…)."
        />
      )}

      {/* ---------------- Pranchas com revisão ---------------- */}
      {pranchas.size > 0 && (
        <section className="space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted">
            <Layers className="h-4 w-4" /> Pranchas ({pranchas.size})
          </h3>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {[...pranchas.entries()].map(([nomePrancha, revisoes]) => {
              const vigente = revisoes[0];
              const historico = revisoes.slice(1);
              return (
                <Card key={nomePrancha} className="overflow-hidden">
                  <Miniatura doc={vigente} />
                  <CardContent className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground" title={nomePrancha}>{nomePrancha}</p>
                        <p className="text-xs text-muted">{DISCIPLINA_LABEL[vigente.disciplina] ?? vigente.disciplina}</p>
                      </div>
                      <Badge tone="success">{vigente.revisao ?? "R00"} · vigente</Badge>
                    </div>

                    <p className="text-xs text-muted">
                      {formatarTamanho(vigente.tamanho)} · {formatarData(vigente.criadoEm)}
                      {vigente.enviadoPor?.nome ? ` · ${vigente.enviadoPor.nome}` : ""}
                    </p>

                    <BotoesDoc doc={vigente} projetoId={id} editavel={editavel} />

                    {editavel && (
                      <Modal
                        title={`Nova revisão — ${nomePrancha}`}
                        trigger={
                          <span className="inline-flex h-9 w-full items-center justify-center gap-1 rounded-lg border border-border bg-surface text-sm font-medium hover:bg-surface-muted">
                            <Plus className="h-4 w-4" /> Nova revisão ({proximaRevisao(vigente.revisao)})
                          </span>
                        }
                      >
                        <DocumentoForm
                          action={criarDocumento}
                          projetoId={id}
                          prancha={nomePrancha}
                          revisaoSugerida={proximaRevisao(vigente.revisao)}
                          disciplina={vigente.disciplina}
                        />
                      </Modal>
                    )}

                    {historico.length > 0 && (
                      <details className="rounded-lg border border-border">
                        <summary className="flex cursor-pointer items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted hover:text-foreground">
                          <History className="h-3.5 w-3.5" /> Histórico ({historico.length} revisão(ões) anterior(es))
                        </summary>
                        <ul className="divide-y divide-border border-t border-border">
                          {historico.map((h) => (
                            <li key={h.id} className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
                              <span className="flex items-center gap-2">
                                <Badge tone="default">{h.revisao ?? "—"}</Badge>
                                <span className="text-muted">{formatarData(h.criadoEm)}</span>
                              </span>
                              <span className="flex items-center gap-2">
                                <a href={urlDocumento(h.id)} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">Abrir</a>
                                {editavel && (
                                  <form action={excluirDocumento}>
                                    <input type="hidden" name="id" value={h.id} />
                                    <input type="hidden" name="projetoId" value={id} />
                                    <ConfirmSubmit confirmacao="Excluir esta revisão?" />
                                  </form>
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* ---------------- Documentos avulsos ---------------- */}
      {avulsos.length > 0 && (
        <section className="space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted">
            <FolderOpen className="h-4 w-4" /> Outros documentos ({avulsos.length})
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {avulsos.map((d) => (
              <Card key={d.id} className={cn("overflow-hidden")}>
                <Miniatura doc={d} />
                <CardContent className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground" title={d.nome}>{d.nome}</p>
                    <Badge tone="default">{CATEGORIA_DOCUMENTO_LABEL[d.categoria]}</Badge>
                  </div>
                  <p className="text-xs text-muted">
                    {formatarTamanho(d.tamanho)} · {formatarData(d.criadoEm)}
                    {d.enviadoPor?.nome ? ` · ${d.enviadoPor.nome}` : ""}
                  </p>
                  <BotoesDoc doc={d} projetoId={id} editavel={editavel} />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
