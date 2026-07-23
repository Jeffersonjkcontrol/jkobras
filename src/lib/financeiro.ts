// Helpers do módulo Financeiro (orçado × realizado por projeto).

type Tone = "default" | "info" | "success" | "danger" | "warning";

export const TIPO_LANCAMENTO_LABEL: Record<string, string> = {
  RECEITA: "Receita",
  DESPESA: "Despesa",
};

export const TIPO_LANCAMENTO_TONE: Record<string, Tone> = {
  RECEITA: "success",
  DESPESA: "danger",
};

export const STATUS_LANCAMENTO_LABEL: Record<string, string> = {
  PREVISTO: "Previsto",
  REALIZADO: "Realizado",
};

export const STATUS_LANCAMENTO_TONE: Record<string, Tone> = {
  PREVISTO: "warning",
  REALIZADO: "info",
};

// Categorias sugeridas em obra/arquitetura.
export const CATEGORIAS = [
  "Material",
  "Mão de obra",
  "Equipamentos",
  "Projeto / Arquitetura",
  "Terceirizados",
  "Impostos / Taxas",
  "Administrativo",
  "Recebimento do cliente",
  "Outros",
] as const;

export type LancamentoLike = {
  tipo: "RECEITA" | "DESPESA";
  status: "PREVISTO" | "REALIZADO";
  valor: number;
};

export type ResumoFinanceiro = {
  receitaPrevista: number;
  receitaRealizada: number;
  despesaPrevista: number;
  despesaRealizada: number;
  saldoRealizado: number;
  saldoPrevisto: number;
};

/** Agrega os lançamentos em previsto/realizado por tipo. */
export function resumoFinanceiro(lancamentos: LancamentoLike[]): ResumoFinanceiro {
  const r: ResumoFinanceiro = {
    receitaPrevista: 0,
    receitaRealizada: 0,
    despesaPrevista: 0,
    despesaRealizada: 0,
    saldoRealizado: 0,
    saldoPrevisto: 0,
  };
  for (const l of lancamentos) {
    const chave = `${l.tipo === "RECEITA" ? "receita" : "despesa"}${l.status === "PREVISTO" ? "Prevista" : "Realizada"}` as
      | "receitaPrevista"
      | "receitaRealizada"
      | "despesaPrevista"
      | "despesaRealizada";
    r[chave] += l.valor ?? 0;
  }
  r.saldoRealizado = r.receitaRealizada - r.despesaRealizada;
  r.saldoPrevisto = r.receitaPrevista - r.despesaPrevista;
  return r;
}

/** Percentual realizado sobre previsto (0-100+, limitado a 100 na barra). */
export function percentual(realizado: number, previsto: number): number {
  if (previsto <= 0) return realizado > 0 ? 100 : 0;
  return Math.round((realizado / previsto) * 100);
}
