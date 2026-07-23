import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Phone, Mail, MapPin, IdCard, Siren, Landmark, HardHat, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { sessaoOrg } from "@/lib/sessao";
import { podeEditar } from "@/lib/permissoes";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { ProfissionalForm } from "@/components/forms/profissional-form";
import { atualizarProfissional, excluirProfissional } from "@/app/actions/equipe";
import { formatarCusto, TIPO_CUSTO_LABEL } from "@/lib/equipe";

function Dado({ icon: Icon, label, valor }: { icon: typeof Phone; label: string; valor: string | null }) {
  if (!valor) return null;
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="text-sm text-foreground">{valor}</p>
      </div>
    </div>
  );
}

export default async function ProfissionalDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await sessaoOrg();
  const org = s.organizacaoId;
  const editavel = podeEditar(s.papel);

  const p = await prisma.profissional.findFirst({
    where: { id, organizacaoId: org },
    include: {
      alocacoes: { include: { projeto: { select: { id: true, titulo: true } } }, orderBy: { criadoEm: "desc" } },
    },
  });
  if (!p) notFound();

  return (
    <div className="space-y-5">
      <Link href="/equipe" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Equipe
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">{p.nome}</h1>
            <Badge tone="info">{p.funcao}</Badge>
            {!p.ativo && <Badge tone="default">Inativo</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted">
            {TIPO_CUSTO_LABEL[p.tipoCusto]} · <span className="font-medium text-foreground">{formatarCusto(p.tipoCusto, p.custoValor)}</span>
          </p>
        </div>
        {editavel && (
          <div className="flex items-center gap-2">
            <Modal
              title="Editar profissional"
              trigger={
                <span className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium hover:bg-surface-muted">
                  <Pencil className="h-4 w-4" /> Editar
                </span>
              }
            >
              <ProfissionalForm action={atualizarProfissional} profissional={p} />
            </Modal>
            <form action={excluirProfissional}>
              <input type="hidden" name="id" value={p.id} />
              <ConfirmSubmit confirmacao="Excluir este profissional? Ele será removido das obras onde está alocado." />
            </form>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Dado icon={Phone} label="Telefone" valor={p.telefone} />
          <Dado icon={Mail} label="E-mail" valor={p.email} />
          <Dado icon={IdCard} label="CPF" valor={p.cpf} />
          <Dado icon={Landmark} label="Chave PIX" valor={p.chavePix} />
          <Dado icon={MapPin} label="Endereço" valor={p.endereco} />
          <Dado icon={Siren} label="Contato de emergência" valor={p.contatoEmergencia} />
        </CardContent>
      </Card>

      {p.observacoes && (
        <Card>
          <CardContent>
            <p className="text-sm font-medium text-foreground">Observações</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{p.observacoes}</p>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
          <HardHat className="h-5 w-5 text-primary" /> Obras onde atua
        </h2>
        {p.alocacoes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-surface p-6 text-center text-sm text-muted">
            Não está alocado em nenhuma obra. Aloque na aba <strong>Equipe</strong> de um projeto.
          </p>
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Obra</TH>
                <TH>Função na obra</TH>
                <TH className="text-right">Custo acordado</TH>
                <TH className="text-right">Ação</TH>
              </tr>
            </THead>
            <tbody>
              {p.alocacoes.map((a) => (
                <TR key={a.id}>
                  <TD className="font-medium">{a.projeto.titulo}</TD>
                  <TD className="text-muted">{a.funcaoNaObra ?? p.funcao}</TD>
                  <TD className="text-right whitespace-nowrap">{formatarCusto(a.tipoCusto, a.custoValor)}</TD>
                  <TD className="text-right">
                    <Link href={`/projetos/${a.projeto.id}/equipe`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                      Abrir <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </div>
  );
}
