import { notFound } from "next/navigation";
import Link from "next/link";
import { Plus, Pencil, Wallet, TrendingUp, TrendingDown, Scale, FileSignature } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { sessaoOrg } from "@/lib/sessao";
import { podeEditar } from "@/lib/permissoes";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { SemPermissao } from "@/components/sem-permissao";
import { LancamentoForm } from "@/components/forms/lancamento-form";
import { criarLancamento, atualizarLancamento, excluirLancamento } from "@/app/actions/financeiro";
import { formatarMoeda, formatarData } from "@/lib/utils";
import {
  resumoFinanceiro,
  percentual,
  TIPO_LANCAMENTO_LABEL,
  TIPO_LANCAMENTO_TONE,
  STATUS_LANCAMENTO_LABEL,
  STATUS_LANCAMENTO_TONE,
} from "@/lib/financeiro";
import { cn } from "@/lib/utils";
import { par, type SP } from "@/lib/listagem";

function Comparativo({ label, previsto, realizado, cor }: { label: string; previsto: number; realizado: number; cor: string }) {
  const pct = Math.min(100, percentual(realizado, previsto));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted">
          <span className="font-semibold text-foreground">{formatarMoeda(realizado)}</span> de {formatarMoeda(previsto)}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-muted">
        <div className={cn("h-full rounded-full", cor)} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-xs text-muted">{percentual(realizado, previsto)}% do previsto realizado</p>
    </div>
  );
}

export default async function FinanceiroPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SP>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const filtroTipo = par(sp, "tipo");
  const s = await sessaoOrg();
  const org = s.organizacaoId;
  const editavel = podeEditar(s.papel);

  // Área sensível: exige permissão de visualização.
  if (!s.perm.financeiro) return <SemPermissao area="o financeiro deste projeto" />;

  const projeto = await prisma.projeto.findFirst({
    where: { id, organizacaoId: org },
    select: { id: true, valorContrato: true },
  });
  if (!projeto) notFound();

  const lancamentos = await prisma.lancamentoFinanceiro.findMany({
    where: { projetoId: id, organizacaoId: org },
    orderBy: { data: "desc" },
  });

  const resumo = resumoFinanceiro(lancamentos);
  const lista = filtroTipo ? lancamentos.filter((l) => l.tipo === filtroTipo) : lancamentos;

  const kpis = [
    { label: "Receitas (realizadas)", valor: resumo.receitaRealizada, icon: TrendingUp, cor: "text-success" },
    { label: "Despesas (realizadas)", valor: resumo.despesaRealizada, icon: TrendingDown, cor: "text-danger" },
    { label: "Saldo (realizado)", valor: resumo.saldoRealizado, icon: Scale, cor: resumo.saldoRealizado >= 0 ? "text-success" : "text-danger" },
    { label: "Valor do contrato", valor: projeto.valorContrato ?? 0, icon: FileSignature, cor: "text-foreground" },
  ];

  const chips: { label: string; tipo?: string }[] = [
    { label: "Todos" },
    { label: "Receitas", tipo: "RECEITA" },
    { label: "Despesas", tipo: "DESPESA" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Wallet className="h-5 w-5 text-primary" /> Financeiro
        </h2>
        {editavel && (
          <Modal
            title="Novo lançamento"
            trigger={<span className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"><Plus className="h-4 w-4" /> Novo lançamento</span>}
          >
            <LancamentoForm action={criarLancamento} projetoId={id} />
          </Modal>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label}>
              <CardContent>
                <p className="flex items-center gap-1 text-sm text-muted"><Icon className={cn("h-4 w-4", k.cor)} /> {k.label}</p>
                <p className={cn("mt-1 text-lg font-bold", k.cor)}>{formatarMoeda(k.valor)}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Orçado × Realizado */}
      <Card>
        <CardContent className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">Orçado × Realizado</h3>
          <Comparativo label="Despesas" previsto={resumo.despesaPrevista} realizado={resumo.despesaRealizada} cor="bg-danger" />
          <Comparativo label="Receitas" previsto={resumo.receitaPrevista} realizado={resumo.receitaRealizada} cor="bg-success" />
          <p className="text-xs text-muted">
            Marque um lançamento como <strong>Previsto</strong> para orçar e como <strong>Realizado</strong> quando efetivar — a barra compara os dois.
          </p>
        </CardContent>
      </Card>

      {/* Filtro + Lista */}
      <div className="flex flex-wrap items-center gap-2">
        {chips.map((c) => {
          const ativo = (c.tipo ?? "") === (filtroTipo ?? "");
          return (
            <Link
              key={c.label}
              href={c.tipo ? `/projetos/${id}/financeiro?tipo=${c.tipo}` : `/projetos/${id}/financeiro`}
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

      {lista.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-surface p-6 text-center text-sm text-muted">Nenhum lançamento{filtroTipo ? " neste filtro" : ""}.</p>
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Data</TH>
              <TH>Descrição</TH>
              <TH>Categoria</TH>
              <TH>Tipo</TH>
              <TH>Situação</TH>
              <TH className="text-right">Valor</TH>
              {editavel && <TH className="text-right">Ações</TH>}
            </tr>
          </THead>
          <tbody>
            {lista.map((l) => (
              <TR key={l.id}>
                <TD className="whitespace-nowrap text-muted">{formatarData(l.data)}</TD>
                <TD className="font-medium">{l.descricao}</TD>
                <TD className="text-muted">{l.categoria ?? "—"}</TD>
                <TD><Badge tone={TIPO_LANCAMENTO_TONE[l.tipo]}>{TIPO_LANCAMENTO_LABEL[l.tipo]}</Badge></TD>
                <TD><Badge tone={STATUS_LANCAMENTO_TONE[l.status]}>{STATUS_LANCAMENTO_LABEL[l.status]}</Badge></TD>
                <TD className={cn("text-right font-semibold", l.tipo === "RECEITA" ? "text-success" : "text-danger")}>
                  {l.tipo === "RECEITA" ? "+" : "−"} {formatarMoeda(l.valor)}
                </TD>
                {editavel && (
                  <TD className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Modal title="Editar lançamento" trigger={<span className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-muted"><Pencil className="h-4 w-4" /></span>}>
                        <LancamentoForm action={atualizarLancamento} lancamento={l} projetoId={id} />
                      </Modal>
                      <form action={excluirLancamento}>
                        <input type="hidden" name="id" value={l.id} />
                        <input type="hidden" name="projetoId" value={id} />
                        <ConfirmSubmit />
                      </form>
                    </div>
                  </TD>
                )}
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
