// Helpers do lado de ARQUITETURA: disciplinas/revisões de prancha,
// aprovações em órgãos e fases de projeto.

type Tone = "default" | "info" | "success" | "danger" | "warning";

// ---------------------------------------------------------------- Disciplinas
export const DISCIPLINAS = [
  "ARQUITETONICO",
  "ESTRUTURAL",
  "ELETRICO",
  "HIDRAULICO",
  "CLIMATIZACAO",
  "INCENDIO",
  "PAISAGISMO",
  "INTERIORES",
  "OUTRO",
] as const;

export const DISCIPLINA_LABEL: Record<string, string> = {
  ARQUITETONICO: "Arquitetônico",
  ESTRUTURAL: "Estrutural",
  ELETRICO: "Elétrico",
  HIDRAULICO: "Hidráulico",
  CLIMATIZACAO: "Climatização",
  INCENDIO: "Incêndio (PPCI)",
  PAISAGISMO: "Paisagismo",
  INTERIORES: "Interiores",
  OUTRO: "Outro",
};

/** Próxima revisão a partir da última (R00 → R01). Aceita "R00" ou "0". */
export function proximaRevisao(ultima: string | null | undefined): string {
  if (!ultima) return "R00";
  const n = parseInt(ultima.replace(/\D/g, ""), 10);
  if (Number.isNaN(n)) return "R00";
  return `R${String(n + 1).padStart(2, "0")}`;
}

/** Ordena revisões da mais nova para a mais antiga (R02, R01, R00). */
export function ordemRevisaoDesc(a: string | null, b: string | null): number {
  const na = parseInt((a ?? "").replace(/\D/g, ""), 10);
  const nb = parseInt((b ?? "").replace(/\D/g, ""), 10);
  if (Number.isNaN(na) && Number.isNaN(nb)) return 0;
  if (Number.isNaN(na)) return 1;
  if (Number.isNaN(nb)) return -1;
  return nb - na;
}

// ---------------------------------------------------------------- Aprovações
export const STATUS_APROVACAO = [
  "PREPARACAO",
  "PROTOCOLADO",
  "EM_ANALISE",
  "EXIGENCIA",
  "APROVADO",
  "INDEFERIDO",
] as const;

export const STATUS_APROVACAO_LABEL: Record<string, string> = {
  PREPARACAO: "Em preparação",
  PROTOCOLADO: "Protocolado",
  EM_ANALISE: "Em análise",
  EXIGENCIA: "Exigência",
  APROVADO: "Aprovado",
  INDEFERIDO: "Indeferido",
};

export const STATUS_APROVACAO_TONE: Record<string, Tone> = {
  PREPARACAO: "default",
  PROTOCOLADO: "info",
  EM_ANALISE: "info",
  EXIGENCIA: "warning",
  APROVADO: "success",
  INDEFERIDO: "danger",
};

// Órgãos sugeridos (campo é texto livre).
export const ORGAOS = [
  "Prefeitura Municipal",
  "Corpo de Bombeiros",
  "CAU/CREA",
  "Vigilância Sanitária",
  "Concessionária de energia",
  "Concessionária de água/esgoto",
  "CETESB / Meio ambiente",
  "Cartório de Registro de Imóveis",
  "Outro",
] as const;

/** Aprovação pendente que já passou do prazo (exige ação). */
export function aprovacaoVencida(
  a: { prazo: Date | string | null; status: string },
  hoje = new Date()
): boolean {
  if (!a.prazo) return false;
  if (a.status === "APROVADO" || a.status === "INDEFERIDO") return false;
  return new Date(a.prazo) < hoje;
}

// -------------------------------------------------------- Fases de projeto
/** Fases usuais de um projeto de arquitetura (baseado na NBR 13532),
 *  com duração sugerida em dias corridos. */
export const FASES_ARQUITETURA = [
  { nome: "Levantamento de dados", dias: 10 },
  { nome: "Estudo preliminar", dias: 20 },
  { nome: "Anteprojeto", dias: 25 },
  { nome: "Projeto legal (aprovação)", dias: 30 },
  { nome: "Projeto executivo", dias: 40 },
  { nome: "Detalhamento e complementares", dias: 25 },
] as const;
