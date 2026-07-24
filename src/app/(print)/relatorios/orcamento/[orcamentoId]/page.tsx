import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sessaoOrg } from "@/lib/sessao";
import { CabecalhoRelatorio } from "@/components/relatorios/cabecalho";
import { formatarMoeda, formatarData } from "@/lib/utils";
import { subtotalItem, totalOrcamento, STATUS_ORCAMENTO_LABEL } from "@/lib/orcamentos";

export default async function RelatorioOrcamentoPage({ params }: { params: Promise<{ orcamentoId: string }> }) {
  const { orcamentoId } = await params;
  const s = await sessaoOrg();
  const org = s.organizacaoId;

  const [orcamento, organizacao] = await Promise.all([
    prisma.orcamento.findFirst({
      where: { id: orcamentoId, organizacaoId: org },
      include: {
        itens: { orderBy: { ordem: "asc" } },
        projeto: {
          select: {
            id: true,
            titulo: true,
            endereco: true,
            areaM2: true,
            tipo: true,
            cliente: { select: { nome: true, telefone: true, email: true, endereco: true, cpfCnpj: true } },
          },
        },
      },
    }),
    prisma.organizacao.findUnique({ where: { id: org }, select: { nome: true, logoData: true } }),
  ]);
  if (!orcamento || !organizacao) notFound();

  const total = totalOrcamento(orcamento.itens);
  const cliente = orcamento.projeto.cliente;

  return (
    <div>
      <CabecalhoRelatorio
        org={organizacao}
        titulo="Proposta / Orçamento"
        subtitulo={orcamento.titulo}
        voltarHref={`/projetos/${orcamento.projeto.id}/orcamentos/${orcamento.id}`}
      />

      {/* Cliente e obra */}
      <section className="evitar-quebra mb-6 grid grid-cols-2 gap-6 text-sm">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Cliente</p>
          <p className="font-semibold">{cliente.nome}</p>
          {cliente.cpfCnpj && <p className="text-neutral-700">{cliente.cpfCnpj}</p>}
          {cliente.telefone && <p className="text-neutral-700">{cliente.telefone}</p>}
          {cliente.email && <p className="text-neutral-700">{cliente.email}</p>}
          {cliente.endereco && <p className="text-neutral-700">{cliente.endereco}</p>}
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Obra / Projeto</p>
          <p className="font-semibold">{orcamento.projeto.titulo}</p>
          <p className="text-neutral-700">{orcamento.projeto.tipo}</p>
          {orcamento.projeto.endereco && <p className="text-neutral-700">{orcamento.projeto.endereco}</p>}
          {orcamento.projeto.areaM2 && <p className="text-neutral-700">Área: {orcamento.projeto.areaM2} m²</p>}
        </div>
      </section>

      {/* Itens */}
      <section className="mb-6">
        <table className="w-full border-collapse text-sm">
          <thead className="imprimir-cores">
            <tr className="bg-neutral-800 text-white">
              <th className="border border-neutral-300 px-2 py-2 text-left font-semibold">#</th>
              <th className="border border-neutral-300 px-2 py-2 text-left font-semibold">Descrição</th>
              <th className="border border-neutral-300 px-2 py-2 text-center font-semibold">Un.</th>
              <th className="border border-neutral-300 px-2 py-2 text-right font-semibold">Qtd</th>
              <th className="border border-neutral-300 px-2 py-2 text-right font-semibold">V. unitário</th>
              <th className="border border-neutral-300 px-2 py-2 text-right font-semibold">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {orcamento.itens.length === 0 ? (
              <tr>
                <td colSpan={6} className="border border-neutral-300 px-2 py-4 text-center text-neutral-500">
                  Nenhum item neste orçamento.
                </td>
              </tr>
            ) : (
              orcamento.itens.map((it, i) => (
                <tr key={it.id} className="evitar-quebra">
                  <td className="border border-neutral-300 px-2 py-1.5 text-neutral-500">{i + 1}</td>
                  <td className="border border-neutral-300 px-2 py-1.5">{it.descricao}</td>
                  <td className="border border-neutral-300 px-2 py-1.5 text-center">{it.unidade}</td>
                  <td className="border border-neutral-300 px-2 py-1.5 text-right">{it.quantidade}</td>
                  <td className="border border-neutral-300 px-2 py-1.5 text-right">{formatarMoeda(it.valorUnitario)}</td>
                  <td className="border border-neutral-300 px-2 py-1.5 text-right font-medium">{formatarMoeda(subtotalItem(it))}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot className="imprimir-cores">
            <tr className="bg-neutral-100">
              <td colSpan={5} className="border border-neutral-300 px-2 py-2.5 text-right font-bold uppercase">Total</td>
              <td className="border border-neutral-300 px-2 py-2.5 text-right text-base font-bold">{formatarMoeda(total)}</td>
            </tr>
          </tfoot>
        </table>
      </section>

      {/* Condições */}
      <section className="evitar-quebra mb-8 text-sm">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Condições</p>
        <p className="text-neutral-700">
          Situação: <strong>{STATUS_ORCAMENTO_LABEL[orcamento.status]}</strong>
          {orcamento.validadeDias != null && <> · Validade da proposta: <strong>{orcamento.validadeDias} dias</strong></>}
        </p>
        {orcamento.observacoes && <p className="mt-2 whitespace-pre-wrap text-neutral-700">{orcamento.observacoes}</p>}
      </section>

      {/* Assinaturas */}
      <section className="evitar-quebra mt-12 grid grid-cols-2 gap-10 text-center text-sm">
        <div>
          <div className="mb-1 border-t border-neutral-800" />
          <p className="font-medium">{organizacao.nome}</p>
          <p className="text-xs text-neutral-500">Responsável</p>
        </div>
        <div>
          <div className="mb-1 border-t border-neutral-800" />
          <p className="font-medium">{cliente.nome}</p>
          <p className="text-xs text-neutral-500">Cliente · Data: ___/___/______</p>
        </div>
      </section>

      <p className="mt-8 text-center text-xs text-neutral-400">
        {organizacao.nome} · Proposta emitida em {formatarData(new Date())}
      </p>
    </div>
  );
}
