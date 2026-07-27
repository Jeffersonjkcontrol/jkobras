import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Users2,
  HardHat,
  Contact,
  HardDrive,
  Clock,
  CalendarClock,
  LogIn,
  KeyRound,
  CreditCard,
  Gauge,
  ScrollText,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ehSuperAdmin, PAPEL_LABEL } from "@/lib/permissoes";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, Select } from "@/components/ui/input";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { DeleteButton } from "@/components/delete-button";
import { TrialForm } from "@/components/forms/trial-form";
import { RedefinirSenhaForm } from "@/components/forms/redefinir-senha-form";
import {
  alternarOrgAtiva,
  definirTrial,
  tornarPermanente,
  excluirOrg,
  salvarPlano,
  salvarComercial,
  entrarComo,
  redefinirSenhaUsuario,
  aplicarPreset,
} from "@/app/actions/admin";
import { formatarData, formatarDataHora, formatarMoeda, cn } from "@/lib/utils";
import { formatarTamanho } from "@/lib/documentos";
import { situacaoAcesso } from "@/lib/tenant";
import { PLANOS_PRESET } from "@/lib/planos";

// Consulta o banco a cada acesso — nunca pré-renderizar no build.
export const dynamic = "force-dynamic";

const PG_LABEL: Record<string, string> = { EM_DIA: "Em dia", PENDENTE: "Pendente", ISENTO: "Isento" };
const PG_TONE: Record<string, "success" | "warning" | "default"> = { EM_DIA: "success", PENDENTE: "warning", ISENTO: "default" };

function paraInputDate(d: Date | null): string {
  return d ? new Date(d).toISOString().slice(0, 10) : "";
}

export default async function AdminOrgDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || !ehSuperAdmin(session.user.papel)) redirect("/");

  const [org, usuarios, disco, logs] = await Promise.all([
    prisma.organizacao.findUnique({
      where: { id },
      include: { _count: { select: { usuarios: true, projetos: true, clientes: true } } },
    }),
    prisma.user.findMany({
      where: { organizacaoId: id },
      orderBy: [{ papel: "asc" }, { criadoEm: "asc" }],
      select: { id: true, nome: true, email: true, papel: true, ativo: true, ultimoAcessoEm: true },
    }),
    prisma.documento.aggregate({ where: { organizacaoId: id }, _sum: { tamanho: true } }),
    prisma.adminLog.findMany({ where: { organizacaoId: id }, orderBy: { criadoEm: "desc" }, take: 12 }),
  ]);
  if (!org) notFound();

  const sit = situacaoAcesso(org);
  const discoUsado = disco._sum.tamanho ?? 0;
  const ultimoAcesso = usuarios
    .map((u) => u.ultimoAcessoEm)
    .filter((d): d is Date => !!d)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  return (
    <div className="space-y-6">
      <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Escritórios
      </Link>

      {/* Cabeçalho + ações rápidas */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">{org.nome}</h1>
            <Badge tone={sit.tone}>{sit.label}</Badge>
            <Badge tone={PG_TONE[org.statusPagamento]}>Pag.: {PG_LABEL[org.statusPagamento]}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted">/{org.slug} · plano <strong className="text-foreground">{org.plano}</strong> · criado em {formatarData(org.criadoEm)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <form action={entrarComo}>
            <input type="hidden" name="id" value={org.id} />
            <Button type="submit" variant="outline" size="sm"><LogIn className="mr-1 h-4 w-4" /> Entrar como</Button>
          </form>
          <Modal title="Período de teste" trigger={<span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-medium hover:bg-surface-muted"><CalendarClock className="h-4 w-4" /> Teste</span>}>
            <TrialForm action={definirTrial} orgId={org.id} orgNome={org.nome} />
          </Modal>
          {org.trialAte && (
            <form action={tornarPermanente}>
              <input type="hidden" name="id" value={org.id} />
              <Button type="submit" variant="outline" size="sm">Tornar permanente</Button>
            </form>
          )}
          <form action={alternarOrgAtiva}>
            <input type="hidden" name="id" value={org.id} />
            <Button type="submit" variant="outline" size="sm">{org.ativa ? "Desativar" : "Ativar"}</Button>
          </form>
          <DeleteButton action={excluirOrg} id={org.id} confirmacao={`Excluir "${org.nome}" e TODOS os dados? Não pode ser desfeito.`} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <Card><CardContent><p className="flex items-center gap-1 text-xs text-muted"><Users2 className="h-3.5 w-3.5" /> Usuários</p><p className="mt-1 text-lg font-bold">{org._count.usuarios}</p></CardContent></Card>
        <Card><CardContent><p className="flex items-center gap-1 text-xs text-muted"><HardHat className="h-3.5 w-3.5" /> Projetos</p><p className="mt-1 text-lg font-bold">{org._count.projetos}</p></CardContent></Card>
        <Card><CardContent><p className="flex items-center gap-1 text-xs text-muted"><Contact className="h-3.5 w-3.5" /> Clientes</p><p className="mt-1 text-lg font-bold">{org._count.clientes}</p></CardContent></Card>
        <Card><CardContent><p className="flex items-center gap-1 text-xs text-muted"><HardDrive className="h-3.5 w-3.5" /> Disco</p><p className="mt-1 text-lg font-bold">{formatarTamanho(discoUsado)}</p></CardContent></Card>
        <Card><CardContent><p className="flex items-center gap-1 text-xs text-muted"><Clock className="h-3.5 w-3.5" /> Último acesso</p><p className="mt-1 text-sm font-semibold">{ultimoAcesso ? formatarData(ultimoAcesso) : "nunca"}</p></CardContent></Card>
        <Card><CardContent><p className="flex items-center gap-1 text-xs text-muted"><CreditCard className="h-3.5 w-3.5" /> Vencimento</p><p className="mt-1 text-sm font-semibold">{org.proximoVencimento ? formatarData(org.proximoVencimento) : "—"}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Plano e limites */}
        <Card>
          <CardContent>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted"><Gauge className="h-4 w-4" /> Plano e limites</h2>

            {/* Presets: 1 clique aplica preço + limites */}
            <div className="mb-4 flex flex-wrap gap-2">
              {PLANOS_PRESET.map((pl) => (
                <form key={pl.nome} action={aplicarPreset}>
                  <input type="hidden" name="id" value={org.id} />
                  <input type="hidden" name="preset" value={pl.nome} />
                  <button
                    type="submit"
                    className={cn(
                      "rounded-lg border px-3 py-2 text-left transition-colors hover:border-primary",
                      org.plano === pl.nome ? "border-primary bg-primary/5" : "border-border"
                    )}
                  >
                    <span className="block text-xs font-semibold text-foreground">{pl.nome}</span>
                    <span className="block text-xs text-muted">{formatarMoeda(pl.precoMensal)}/mês</span>
                  </button>
                </form>
              ))}
            </div>

            <form action={salvarPlano} className="space-y-4">
              <input type="hidden" name="id" value={org.id} />
              <div>
                <Label htmlFor="plano">Plano</Label>
                <Input id="plano" name="plano" defaultValue={org.plano} placeholder="Ex.: Grátis, Pro, Enterprise" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="limiteProjetos">Máx. projetos</Label>
                  <Input id="limiteProjetos" name="limiteProjetos" type="number" min="0" defaultValue={org.limiteProjetos ?? ""} placeholder="∞" />
                </div>
                <div>
                  <Label htmlFor="limiteUsuarios">Máx. usuários</Label>
                  <Input id="limiteUsuarios" name="limiteUsuarios" type="number" min="0" defaultValue={org.limiteUsuarios ?? ""} placeholder="∞" />
                </div>
                <div>
                  <Label htmlFor="limiteArmazenamentoMB">Máx. MB</Label>
                  <Input id="limiteArmazenamentoMB" name="limiteArmazenamentoMB" type="number" min="0" defaultValue={org.limiteArmazenamentoMB ?? ""} placeholder="∞" />
                </div>
              </div>
              <p className="text-xs text-muted">Vazio = ilimitado. O app bloqueia a criação ao atingir o limite.</p>
              <div className="flex justify-end"><Button type="submit" size="sm">Salvar plano</Button></div>
            </form>
          </CardContent>
        </Card>

        {/* Comercial */}
        <Card>
          <CardContent>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted"><CreditCard className="h-4 w-4" /> Comercial (interno)</h2>
            <form action={salvarComercial} className="space-y-4">
              <input type="hidden" name="id" value={org.id} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="statusPagamento">Pagamento</Label>
                  <Select id="statusPagamento" name="statusPagamento" defaultValue={org.statusPagamento}>
                    <option value="EM_DIA">Em dia</option>
                    <option value="PENDENTE">Pendente</option>
                    <option value="ISENTO">Isento</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="precoMensal">Valor mensal (R$)</Label>
                  <Input id="precoMensal" name="precoMensal" type="number" step="0.01" min="0" defaultValue={org.precoMensal ?? ""} placeholder="Ex.: 297" />
                </div>
                <div>
                  <Label htmlFor="proximoVencimento">Próximo vencimento</Label>
                  <Input id="proximoVencimento" name="proximoVencimento" type="date" defaultValue={paraInputDate(org.proximoVencimento)} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="contatoNome">Contato</Label>
                  <Input id="contatoNome" name="contatoNome" defaultValue={org.contatoNome ?? ""} placeholder="Nome do responsável" />
                </div>
                <div>
                  <Label htmlFor="contatoTelefone">Telefone</Label>
                  <Input id="contatoTelefone" name="contatoTelefone" defaultValue={org.contatoTelefone ?? ""} />
                </div>
              </div>
              <div>
                <Label htmlFor="contatoEmail">E-mail de contato</Label>
                <Input id="contatoEmail" name="contatoEmail" type="email" defaultValue={org.contatoEmail ?? ""} />
              </div>
              <div>
                <Label htmlFor="notasInternas">Notas internas</Label>
                <Textarea id="notasInternas" name="notasInternas" defaultValue={org.notasInternas ?? ""} placeholder="Negociação, histórico, observações…" />
              </div>
              <div className="flex justify-end"><Button type="submit" size="sm">Salvar comercial</Button></div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Usuários */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground"><Users2 className="h-5 w-5 text-primary" /> Usuários</h2>
        {usuarios.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-surface p-6 text-center text-sm text-muted">Sem usuários.</p>
        ) : (
          <Table>
            <THead>
              <tr><TH>Nome</TH><TH>E-mail</TH><TH>Papel</TH><TH>Situação</TH><TH>Último acesso</TH><TH className="text-right">Senha</TH></tr>
            </THead>
            <tbody>
              {usuarios.map((u) => (
                <TR key={u.id}>
                  <TD className="font-medium">{u.nome}</TD>
                  <TD className="text-muted">{u.email}</TD>
                  <TD>{PAPEL_LABEL[u.papel]}</TD>
                  <TD>{u.ativo ? <Badge tone="success">Ativo</Badge> : <Badge tone="default">Inativo</Badge>}</TD>
                  <TD className="text-muted">{u.ultimoAcessoEm ? formatarDataHora(u.ultimoAcessoEm) : "nunca"}</TD>
                  <TD className="text-right">
                    <Modal title="Redefinir senha" trigger={<span className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-surface px-2.5 text-xs font-medium hover:bg-surface-muted"><KeyRound className="h-3.5 w-3.5" /> Redefinir</span>}>
                      <RedefinirSenhaForm action={redefinirSenhaUsuario} userId={u.id} orgId={org.id} email={u.email} />
                    </Modal>
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      {/* Log de auditoria */}
      {logs.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground"><ScrollText className="h-5 w-5 text-primary" /> Log de ações</h2>
          <ul className="divide-y divide-border rounded-xl border border-border bg-surface text-sm">
            {logs.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                <span><strong className="text-foreground">{l.acao.replace(/_/g, " ")}</strong>{l.detalhe ? <span className="text-muted"> · {l.detalhe}</span> : null}</span>
                <span className="text-xs text-muted">{l.atorEmail} · {formatarDataHora(l.criadoEm)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
