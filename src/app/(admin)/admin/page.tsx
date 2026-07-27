import Link from "next/link";
import { Plus, Building2, PlayCircle, CalendarClock, AlertTriangle, ArrowRight, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { CriarEscritorioForm } from "@/components/forms/criar-escritorio-form";
import { criarEscritorio } from "@/app/actions/admin";
import { formatarData, formatarMoeda } from "@/lib/utils";
import { situacaoAcesso } from "@/lib/tenant";

const PG_LABEL: Record<string, string> = { EM_DIA: "Em dia", PENDENTE: "Pendente", ISENTO: "Isento" };
const PG_TONE: Record<string, "success" | "warning" | "default"> = { EM_DIA: "success", PENDENTE: "warning", ISENTO: "default" };

export default async function AdminPage() {
  const orgs = await prisma.organizacao.findMany({
    orderBy: { criadoEm: "desc" },
    include: { _count: { select: { usuarios: true, projetos: true } } },
  });

  const situacoes = orgs.map((o) => situacaoAcesso(o));
  const total = orgs.length;
  const emTeste = situacoes.filter((s) => s.dias !== null && s.dias >= 0 && s.label !== "Desativado").length;
  const expirados = situacoes.filter((s) => s.label === "Teste expirado").length;
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const novosMes = orgs.filter((o) => o.criadoEm >= inicioMes).length;
  const pendentes = orgs.filter((o) => o.statusPagamento === "PENDENTE").length;
  const mrr = orgs.filter((o) => o.statusPagamento === "EM_DIA").reduce((s, o) => s + (o.precoMensal ?? 0), 0);

  return (
    <div>
      <PageHeader
        titulo="Escritórios"
        descricao="Central de controle da plataforma JK Obras."
        acao={
          <Modal
            title="Novo escritório"
            trigger={
              <span className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">
                <Plus className="h-4 w-4" /> Novo escritório
              </span>
            }
          >
            <CriarEscritorioForm action={criarEscritorio} />
          </Modal>
        }
      />

      {/* KPIs da plataforma */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-6">
        <Card><CardContent><p className="flex items-center gap-1 text-xs text-muted"><Building2 className="h-3.5 w-3.5" /> Escritórios</p><p className="mt-1 text-2xl font-bold">{total}</p></CardContent></Card>
        <Card><CardContent><p className="flex items-center gap-1 text-xs text-muted"><Wallet className="h-3.5 w-3.5" /> Receita mensal</p><p className="mt-1 text-xl font-bold text-success">{formatarMoeda(mrr)}</p></CardContent></Card>
        <Card><CardContent><p className="flex items-center gap-1 text-xs text-muted"><PlayCircle className="h-3.5 w-3.5" /> Novos no mês</p><p className="mt-1 text-2xl font-bold">{novosMes}</p></CardContent></Card>
        <Card><CardContent><p className="flex items-center gap-1 text-xs text-muted"><CalendarClock className="h-3.5 w-3.5" /> Em teste</p><p className="mt-1 text-2xl font-bold text-primary">{emTeste}</p></CardContent></Card>
        <Card><CardContent><p className="flex items-center gap-1 text-xs text-muted"><AlertTriangle className="h-3.5 w-3.5" /> Teste expirado</p><p className="mt-1 text-2xl font-bold text-danger">{expirados}</p></CardContent></Card>
        <Card><CardContent><p className="flex items-center gap-1 text-xs text-muted"><AlertTriangle className="h-3.5 w-3.5" /> Pagto. pendente</p><p className="mt-1 text-2xl font-bold text-warning">{pendentes}</p></CardContent></Card>
      </div>

      {orgs.length === 0 ? (
        <EmptyState titulo="Nenhum escritório ainda" descricao="Crie um manualmente ou aguarde cadastros em /cadastro." />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Escritório</TH>
              <TH>Plano</TH>
              <TH>Acesso</TH>
              <TH>Pagamento</TH>
              <TH className="text-right">Usuários</TH>
              <TH className="text-right">Projetos</TH>
              <TH>Desde</TH>
              <TH className="text-right">Abrir</TH>
            </tr>
          </THead>
          <tbody>
            {orgs.map((o, i) => {
              const sit = situacoes[i];
              return (
                <TR key={o.id}>
                  <TD className="font-medium">
                    <Link href={`/admin/${o.id}`} className="hover:text-primary">{o.nome}</Link>
                    <span className="block text-xs text-muted">/{o.slug}</span>
                  </TD>
                  <TD className="text-muted">{o.plano}</TD>
                  <TD><Badge tone={sit.tone}>{sit.label}</Badge></TD>
                  <TD><Badge tone={PG_TONE[o.statusPagamento]}>{PG_LABEL[o.statusPagamento]}</Badge></TD>
                  <TD className="text-right">{o._count.usuarios}</TD>
                  <TD className="text-right">{o._count.projetos}</TD>
                  <TD className="text-muted">{formatarData(o.criadoEm)}</TD>
                  <TD className="text-right">
                    <Link href={`/admin/${o.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                      Abrir <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </TD>
                </TR>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
}
