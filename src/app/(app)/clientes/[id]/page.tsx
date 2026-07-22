import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Phone, Mail, MapPin, HardHat, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { sessaoOrg } from "@/lib/sessao";
import { podeEditar } from "@/lib/permissoes";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { ClienteForm } from "@/components/forms/cliente-form";
import { atualizarCliente, excluirCliente } from "@/app/actions/clientes";
import { formatarMoeda, formatarData } from "@/lib/utils";
import { statusCalculadoProjeto, STATUS_LABEL, STATUS_TONE } from "@/lib/projetos";

export default async function ClienteDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await sessaoOrg();
  const editavel = podeEditar(s.papel);

  const cliente = await prisma.cliente.findFirst({
    where: { id, organizacaoId: s.organizacaoId },
    include: { projetos: { include: { etapas: true }, orderBy: { criadoEm: "desc" } } },
  });
  if (!cliente) notFound();

  const hoje = new Date();

  return (
    <div className="space-y-6">
      <Link href="/clientes" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{cliente.nome}</h1>
            <Badge tone="default">{cliente.tipo === "PJ" ? "Pessoa Jurídica" : "Pessoa Física"}</Badge>
          </div>
          {cliente.cpfCnpj && <p className="mt-1 text-sm text-muted">{cliente.cpfCnpj}</p>}
        </div>
        {editavel && (
          <div className="flex items-center gap-2">
            <Modal
              title="Editar cliente"
              trigger={
                <span className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium hover:bg-surface-muted">
                  <Pencil className="h-4 w-4" /> Editar
                </span>
              }
            >
              <ClienteForm action={atualizarCliente} cliente={cliente} />
            </Modal>
            <form action={excluirCliente}>
              <input type="hidden" name="id" value={cliente.id} />
              <input type="hidden" name="redirecionar" value="1" />
              <ConfirmSubmit confirmacao="Excluir este cliente?" />
            </form>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-muted" />
            <span className="text-sm">{cliente.telefone ?? "—"}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-muted" />
            <span className="text-sm">{cliente.email ?? "—"}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-muted" />
            <span className="text-sm">{cliente.endereco ?? "—"}</span>
          </CardContent>
        </Card>
      </div>

      {cliente.observacoes && (
        <Card>
          <CardContent>
            <p className="text-sm text-muted">{cliente.observacoes}</p>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Projetos ({cliente.projetos.length})</h2>
        {cliente.projetos.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-surface p-6 text-center text-sm text-muted">
            Nenhum projeto para este cliente.
          </p>
        ) : (
          <ul className="space-y-2">
            {cliente.projetos.map((p) => {
              const status = statusCalculadoProjeto(p.status, p.dataInicioPrev, p.dataFimPrev, p.etapas, hoje);
              return (
                <li key={p.id}>
                  <Link
                    href={`/projetos/${p.id}`}
                    className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3 hover:border-primary"
                  >
                    <div className="flex items-center gap-2">
                      <HardHat className="h-5 w-5 text-muted" />
                      <div>
                        <p className="font-medium text-foreground">{p.titulo}</p>
                        <p className="text-xs text-muted">
                          {p.tipo} · {formatarData(p.dataInicioPrev)}–{formatarData(p.dataFimPrev)}
                          {p.valorContrato ? ` · ${formatarMoeda(p.valorContrato)}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>
                      <ArrowRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
