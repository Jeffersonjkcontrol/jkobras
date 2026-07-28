import { notFound } from "next/navigation";
import Link from "next/link";
import { Plus, Camera, CloudSun, ClipboardList, FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { sessaoOrg } from "@/lib/sessao";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { RDOForm } from "@/components/forms/rdo-form";
import { criarRDO, excluirRDO } from "@/app/actions/rdo";
import { formatarData, formatarDataHora } from "@/lib/utils";
import { urlFoto } from "@/lib/arquivos";

const ITEM_RDO_TONE: Record<string, "success" | "warning" | "danger"> = {
  OK: "success",
  ATENCAO: "warning",
  PROBLEMA: "danger",
};
const ITEM_RDO_LABEL: Record<string, string> = { OK: "OK", ATENCAO: "Atenção", PROBLEMA: "Problema" };

export default async function ProjetoRDOPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await sessaoOrg();
  const org = s.organizacaoId;

  const projeto = await prisma.projeto.findFirst({
    where: { id, organizacaoId: org },
    select: {
      id: true,
      diarios: {
        orderBy: { data: "desc" },
        include: { itens: { orderBy: { ordem: "asc" } }, fotos: true, criadoPor: { select: { nome: true } } },
      },
    },
  });
  if (!projeto) notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <ClipboardList className="h-5 w-5 text-primary" /> Diário de Obra (RDO)
        </h2>
        <div className="flex items-center gap-2">
          <Link
            href={`/relatorios/rdo/${projeto.id}`}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium hover:bg-surface-muted"
          >
            <FileText className="h-4 w-4" /> Relatório do período
          </Link>
          <Modal
            title="Novo RDO"
            trigger={<span className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"><Plus className="h-4 w-4" /> Novo RDO</span>}
          >
            <RDOForm action={criarRDO} projetoId={projeto.id} />
          </Modal>
        </div>
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
                      <a key={f.id} href={urlFoto(f.id)} target="_blank" rel="noreferrer">
                        <img src={urlFoto(f.id)} alt={f.legenda ?? "Foto da obra"} className="h-20 w-20 rounded-lg border border-border object-cover" />
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
