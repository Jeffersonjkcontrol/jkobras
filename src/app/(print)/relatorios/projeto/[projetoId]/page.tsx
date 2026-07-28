import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sessaoOrg } from "@/lib/sessao";
import { CabecalhoRelatorio } from "@/components/relatorios/cabecalho";
import { formatarMoeda, formatarData } from "@/lib/utils";
import { statusCalculadoProjeto, statusCalculadoEtapa, etapaAtrasada, diasAtraso, STATUS_LABEL } from "@/lib/projetos";
import { resumoFinanceiro, percentual } from "@/lib/financeiro";
import { totalOrcamento, STATUS_ORCAMENTO_LABEL } from "@/lib/orcamentos";
import { formatarCusto } from "@/lib/equipe";

export default async function RelatorioProjetoPage({ params }: { params: Promise<{ projetoId: string }> }) {
  const { projetoId } = await params;
  const s = await sessaoOrg();
  const org = s.organizacaoId;

  const [projeto, organizacao] = await Promise.all([
    prisma.projeto.findFirst({
      where: { id: projetoId, organizacaoId: org },
      include: {
        cliente: { select: { nome: true, telefone: true } },
        responsavel: { select: { nome: true } },
        // O responsável é definido na sub-etapa; aqui juntamos os nomes por etapa.
        etapas: {
          orderBy: { ordem: "asc" },
          include: { subEtapas: { select: { responsavelProf: { select: { nome: true } } } } },
        },
        lancamentos: true,
        orcamentos: { include: { itens: { select: { quantidade: true, valorUnitario: true } } }, orderBy: { criadoEm: "desc" } },
        alocacoes: { include: { profissional: { select: { nome: true, funcao: true } } }, orderBy: { criadoEm: "asc" } },
        _count: { select: { diarios: true, documentos: true } },
      },
    }),
    prisma.organizacao.findUnique({ where: { id: org }, select: { nome: true, logoData: true } }),
  ]);
  if (!projeto || !organizacao) notFound();

  const hoje = new Date();
  const status = statusCalculadoProjeto(projeto.status, projeto.dataInicioPrev, projeto.dataFimPrev, projeto.etapas, hoje);
  const progressoMedio =
    projeto.etapas.length > 0
      ? Math.round(projeto.etapas.reduce((sum, e) => sum + e.progresso, 0) / projeto.etapas.length)
      : 0;
  const atrasadas = projeto.etapas.filter((e) => etapaAtrasada(e, hoje));
  const fin = resumoFinanceiro(projeto.lancamentos);

  return (
    <div>
      <CabecalhoRelatorio
        org={organizacao}
        titulo="Relatório do Projeto"
        subtitulo={projeto.titulo}
        voltarHref={`/projetos/${projeto.id}`}
      />

      {/* Identificação */}
      <section className="evitar-quebra mb-6 grid grid-cols-2 gap-6 text-sm">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Obra</p>
          <p className="font-semibold">{projeto.titulo}</p>
          <p className="text-neutral-700">{projeto.tipo}{projeto.areaM2 ? ` · ${projeto.areaM2} m²` : ""}</p>
          {projeto.endereco && <p className="text-neutral-700">{projeto.endereco}</p>}
          <p className="text-neutral-700">Cliente: {projeto.cliente.nome}</p>
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Situação</p>
          <p className="text-neutral-700">Status: <strong>{STATUS_LABEL[status]}</strong></p>
          <p className="text-neutral-700">Progresso: <strong>{progressoMedio}%</strong></p>
          <p className="text-neutral-700">Prazo: {formatarData(projeto.dataInicioPrev)} a {formatarData(projeto.dataFimPrev)}</p>
          {s.perm.financeiro && <p className="text-neutral-700">Contrato: <strong>{formatarMoeda(projeto.valorContrato)}</strong></p>}
          {projeto.responsavel?.nome && <p className="text-neutral-700">Responsável: {projeto.responsavel.nome}</p>}
        </div>
      </section>

      {/* Etapas */}
      <section className="evitar-quebra mb-6">
        <h2 className="mb-2 border-b border-neutral-300 pb-1 text-sm font-bold uppercase tracking-wide">
          Cronograma {atrasadas.length > 0 && <span className="font-normal text-red-700">— {atrasadas.length} etapa(s) atrasada(s)</span>}
        </h2>
        {projeto.etapas.length === 0 ? (
          <p className="text-sm text-neutral-500">Nenhuma etapa cadastrada.</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead className="imprimir-cores">
              <tr className="bg-neutral-100">
                <th className="border border-neutral-300 px-2 py-1.5 text-left font-semibold">Etapa</th>
                <th className="border border-neutral-300 px-2 py-1.5 text-left font-semibold">Período previsto</th>
                <th className="border border-neutral-300 px-2 py-1.5 text-left font-semibold">Responsável</th>
                <th className="border border-neutral-300 px-2 py-1.5 text-center font-semibold">Situação</th>
                <th className="border border-neutral-300 px-2 py-1.5 text-right font-semibold">Progresso</th>
              </tr>
            </thead>
            <tbody>
              {projeto.etapas.map((e) => {
                const st = statusCalculadoEtapa(e, hoje);
                const atrasada = etapaAtrasada(e, hoje);
                const responsaveis = [
                  ...new Set(e.subEtapas.map((sub) => sub.responsavelProf?.nome).filter(Boolean)),
                ].join(", ");
                return (
                  <tr key={e.id} className="evitar-quebra">
                    <td className="border border-neutral-300 px-2 py-1.5">{e.nome}</td>
                    <td className="border border-neutral-300 px-2 py-1.5">{formatarData(e.inicioPrev)} a {formatarData(e.fimPrev)}</td>
                    <td className="border border-neutral-300 px-2 py-1.5">{responsaveis || "—"}</td>
                    <td className={`border border-neutral-300 px-2 py-1.5 text-center ${atrasada ? "font-semibold text-red-700" : ""}`}>
                      {STATUS_LABEL[st]}{atrasada ? ` (+${diasAtraso(e, hoje)}d)` : ""}
                    </td>
                    <td className="border border-neutral-300 px-2 py-1.5 text-right font-medium">{e.progresso}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {/* Financeiro — só para quem tem permissão de ver valores */}
      {s.perm.financeiro && (
      <section className="evitar-quebra mb-6">
        <h2 className="mb-2 border-b border-neutral-300 pb-1 text-sm font-bold uppercase tracking-wide">Financeiro</h2>
        <table className="w-full border-collapse text-sm">
          <thead className="imprimir-cores">
            <tr className="bg-neutral-100">
              <th className="border border-neutral-300 px-2 py-1.5 text-left font-semibold">Indicador</th>
              <th className="border border-neutral-300 px-2 py-1.5 text-right font-semibold">Previsto (orçado)</th>
              <th className="border border-neutral-300 px-2 py-1.5 text-right font-semibold">Realizado</th>
              <th className="border border-neutral-300 px-2 py-1.5 text-right font-semibold">% realizado</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-neutral-300 px-2 py-1.5">Receitas</td>
              <td className="border border-neutral-300 px-2 py-1.5 text-right">{formatarMoeda(fin.receitaPrevista)}</td>
              <td className="border border-neutral-300 px-2 py-1.5 text-right font-medium">{formatarMoeda(fin.receitaRealizada)}</td>
              <td className="border border-neutral-300 px-2 py-1.5 text-right">{percentual(fin.receitaRealizada, fin.receitaPrevista)}%</td>
            </tr>
            <tr>
              <td className="border border-neutral-300 px-2 py-1.5">Despesas</td>
              <td className="border border-neutral-300 px-2 py-1.5 text-right">{formatarMoeda(fin.despesaPrevista)}</td>
              <td className="border border-neutral-300 px-2 py-1.5 text-right font-medium">{formatarMoeda(fin.despesaRealizada)}</td>
              <td className="border border-neutral-300 px-2 py-1.5 text-right">{percentual(fin.despesaRealizada, fin.despesaPrevista)}%</td>
            </tr>
            <tr className="imprimir-cores bg-neutral-100">
              <td className="border border-neutral-300 px-2 py-2 font-bold">Saldo</td>
              <td className="border border-neutral-300 px-2 py-2 text-right">{formatarMoeda(fin.saldoPrevisto)}</td>
              <td className={`border border-neutral-300 px-2 py-2 text-right font-bold ${fin.saldoRealizado < 0 ? "text-red-700" : ""}`}>
                {formatarMoeda(fin.saldoRealizado)}
              </td>
              <td className="border border-neutral-300 px-2 py-2" />
            </tr>
          </tbody>
        </table>
      </section>
      )}

      {/* Equipe */}
      <section className="evitar-quebra mb-6">
        <h2 className="mb-2 border-b border-neutral-300 pb-1 text-sm font-bold uppercase tracking-wide">Equipe na obra</h2>
        {projeto.alocacoes.length === 0 ? (
          <p className="text-sm text-neutral-500">Nenhum profissional alocado.</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead className="imprimir-cores">
              <tr className="bg-neutral-100">
                <th className="border border-neutral-300 px-2 py-1.5 text-left font-semibold">Profissional</th>
                <th className="border border-neutral-300 px-2 py-1.5 text-left font-semibold">Função</th>
                {s.perm.custosEquipe && <th className="border border-neutral-300 px-2 py-1.5 text-right font-semibold">Custo acordado</th>}
              </tr>
            </thead>
            <tbody>
              {projeto.alocacoes.map((a) => (
                <tr key={a.id} className="evitar-quebra">
                  <td className="border border-neutral-300 px-2 py-1.5">{a.profissional.nome}</td>
                  <td className="border border-neutral-300 px-2 py-1.5">{a.funcaoNaObra ?? a.profissional.funcao}</td>
                  {s.perm.custosEquipe && <td className="border border-neutral-300 px-2 py-1.5 text-right">{formatarCusto(a.tipoCusto, a.custoValor)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Orçamentos — só para quem tem permissão */}
      {s.perm.orcamentos && projeto.orcamentos.length > 0 && (
        <section className="evitar-quebra mb-6">
          <h2 className="mb-2 border-b border-neutral-300 pb-1 text-sm font-bold uppercase tracking-wide">Orçamentos</h2>
          <table className="w-full border-collapse text-sm">
            <thead className="imprimir-cores">
              <tr className="bg-neutral-100">
                <th className="border border-neutral-300 px-2 py-1.5 text-left font-semibold">Proposta</th>
                <th className="border border-neutral-300 px-2 py-1.5 text-left font-semibold">Situação</th>
                <th className="border border-neutral-300 px-2 py-1.5 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {projeto.orcamentos.map((o) => (
                <tr key={o.id} className="evitar-quebra">
                  <td className="border border-neutral-300 px-2 py-1.5">{o.titulo}</td>
                  <td className="border border-neutral-300 px-2 py-1.5">{STATUS_ORCAMENTO_LABEL[o.status]}</td>
                  <td className="border border-neutral-300 px-2 py-1.5 text-right font-medium">{formatarMoeda(totalOrcamento(o.itens))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <p className="text-xs text-neutral-500">
        Registros no período: {projeto._count.diarios} diário(s) de obra · {projeto._count.documentos} documento(s) anexado(s).
      </p>

      <p className="mt-8 text-center text-xs text-neutral-400">
        {organizacao.nome} · {projeto.titulo} · Emitido em {formatarData(new Date())}
      </p>
    </div>
  );
}
