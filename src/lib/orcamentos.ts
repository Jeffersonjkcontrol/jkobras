// Helpers do módulo de Orçamentos (propostas por projeto).

type Tone = "default" | "info" | "success" | "danger" | "warning";

export const STATUS_ORCAMENTO_LABEL: Record<string, string> = {
  RASCUNHO: "Rascunho",
  ENVIADO: "Enviado",
  APROVADO: "Aprovado",
  REJEITADO: "Rejeitado",
};

export const STATUS_ORCAMENTO_TONE: Record<string, Tone> = {
  RASCUNHO: "default",
  ENVIADO: "info",
  APROVADO: "success",
  REJEITADO: "danger",
};

export const STATUS_ORCAMENTO = ["RASCUNHO", "ENVIADO", "APROVADO", "REJEITADO"] as const;

// Unidades comuns em construção civil / arquitetura.
export const UNIDADES = ["un", "m²", "m³", "m", "kg", "vb", "h", "dia", "cj", "%"] as const;

export type ItemLike = { quantidade: number; valorUnitario: number };

export function subtotalItem(i: ItemLike): number {
  return (i.quantidade ?? 0) * (i.valorUnitario ?? 0);
}

export function totalOrcamento(itens: ItemLike[]): number {
  return itens.reduce((s, i) => s + subtotalItem(i), 0);
}
