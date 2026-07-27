// Planos pré-definidos da plataforma. São a base dos "presets" no painel do
// super-admin: aplicar um plano preenche preço + limites de uma vez.
// Ajuste os números aqui e eles valem em toda a plataforma.

export type PlanoPreset = {
  nome: string;
  precoMensal: number;
  limiteProjetos: number | null; // null = ilimitado
  limiteUsuarios: number | null;
  limiteArmazenamentoMB: number | null;
  destaque?: boolean;
};

export const PLANOS_PRESET: PlanoPreset[] = [
  { nome: "Essencial", precoMensal: 149, limiteProjetos: 3, limiteUsuarios: 3, limiteArmazenamentoMB: 2048 },
  { nome: "Profissional", precoMensal: 297, limiteProjetos: null, limiteUsuarios: 10, limiteArmazenamentoMB: 10240, destaque: true },
  { nome: "Escritório", precoMensal: 597, limiteProjetos: null, limiteUsuarios: null, limiteArmazenamentoMB: 51200 },
];

export function presetPorNome(nome: string): PlanoPreset | undefined {
  return PLANOS_PRESET.find((p) => p.nome === nome);
}
