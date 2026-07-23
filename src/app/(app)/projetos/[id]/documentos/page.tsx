import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  FolderOpen,
  Map,
  FileText,
  FileCheck2,
  Calculator,
  Image as ImageIcon,
  File as FileIcon,
  Download,
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
import { formatarData, cn } from "@/lib/utils";
import {
  CATEGORIA_DOCUMENTO_LABEL,
  CATEGORIAS_DOCUMENTO,
  formatarTamanho,
  extensaoDe,
} from "@/lib/documentos";
import { par, type SP } from "@/lib/listagem";

const ICONE_CATEGORIA: Record<string, LucideIcon> = {
  PLANTA: Map,
  CONTRATO: FileText,
  LICENCA: FileCheck2,
  ORCAMENTO: Calculator,
  FOTO: ImageIcon,
  OUTRO: FileIcon,
};

const IMAGENS = ["png", "jpg", "jpeg", "webp"];

export default async function DocumentosPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SP>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const filtro = par(sp, "cat");
  const s = await sessaoOrg();
  const org = s.organizacaoId;
  const editavel = podeEditar(s.papel);

  const projeto = await prisma.projeto.findFirst({ where: { id, organizacaoId: org }, select: { id: true } });
  if (!projeto) notFound();

  const catValida =
    filtro && (CATEGORIAS_DOCUMENTO as readonly string[]).includes(filtro)
      ? (filtro as (typeof CATEGORIAS_DOCUMENTO)[number])
      : undefined;

  const documentos = await prisma.documento.findMany({
    where: { projetoId: id, organizacaoId: org, ...(catValida ? { categoria: catValida } : {}) },
    orderBy: { criadoEm: "desc" },
    include: { enviadoPor: { select: { nome: true } } },
  });

  const chips = [{ label: "Todos", cat: undefined as string | undefined }, ...CATEGORIAS_DOCUMENTO.map((c) => ({ label: CATEGORIA_DOCUMENTO_LABEL[c], cat: c }))];

  return (
    <div className="space-y-4">
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

      <div className="flex flex-wrap items-center gap-2">
        {chips.map((c) => {
          const ativo = (c.cat ?? "") === (filtro ?? "");
          return (
            <Link
              key={c.label}
              href={c.cat ? `/projetos/${id}/documentos?cat=${c.cat}` : `/projetos/${id}/documentos`}
              className={cn(
                "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                ativo ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted hover:text-foreground"
              )}
            >
              {c.label}
            </Link>
          );
        })}
      </div>

      {documentos.length === 0 ? (
        <EmptyState titulo="Nenhum documento" descricao="Envie plantas, contratos, licenças e outros arquivos deste projeto." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documentos.map((d) => {
            const ext = extensaoDe(d.url);
            const ehImagem = IMAGENS.includes(ext);
            const Icon = ICONE_CATEGORIA[d.categoria] ?? FileIcon;
            return (
              <Card key={d.id} className="overflow-hidden">
                <a href={d.url} target="_blank" rel="noreferrer" className="block">
                  {ehImagem ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={d.url} alt={d.nome} className="h-36 w-full border-b border-border object-cover" />
                  ) : (
                    <div className="flex h-36 flex-col items-center justify-center gap-2 border-b border-border bg-surface-muted/40">
                      <Icon className="h-12 w-12 text-muted" />
                      <span className="text-xs font-semibold uppercase text-muted">{ext || "arquivo"}</span>
                    </div>
                  )}
                </a>
                <CardContent className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground" title={d.nome}>{d.nome}</p>
                    <Badge tone="default">{CATEGORIA_DOCUMENTO_LABEL[d.categoria]}</Badge>
                  </div>
                  <p className="text-xs text-muted">
                    {formatarTamanho(d.tamanho)} · {formatarData(d.criadoEm)}
                    {d.enviadoPor?.nome ? ` · ${d.enviadoPor.nome}` : ""}
                  </p>
                  <div className="flex items-center justify-between">
                    <a href={d.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                      <Download className="h-3.5 w-3.5" /> Abrir
                    </a>
                    {editavel && (
                      <form action={excluirDocumento}>
                        <input type="hidden" name="id" value={d.id} />
                        <input type="hidden" name="projetoId" value={id} />
                        <ConfirmSubmit confirmacao="Excluir este documento?" />
                      </form>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
