import { diferencaDias } from "./utils";

export type EtapaLike = {
  fimPrev: Date | string;
  fimReal?: Date | string | null;
  progresso: number;
};

/** Progresso de uma etapa pela proporção de sub-etapas concluídas (0-100). */
export function progressoEtapa(subEtapas: { status: string }[]): number {
  if (subEtapas.length === 0) return 0;
  const feitas = subEtapas.filter((s) => s.status === "CONCLUIDA").length;
  return Math.round((feitas / subEtapas.length) * 100);
}

/** True se o projeto deve ser considerado concluído (manual ou todas as etapas 100%). */
export function projetoConcluido(statusManual: string, etapas: EtapaLike[]): boolean {
  if (statusManual === "CONCLUIDA") return true;
  return etapas.length > 0 && etapas.every((e) => e.progresso >= 100);
}

/** Uma etapa está atrasada se passou da data prevista e não foi concluída, ou concluiu tarde. */
export function etapaAtrasada(etapa: EtapaLike, hoje = new Date()): boolean {
  const fimPrev = new Date(etapa.fimPrev);
  if (etapa.fimReal) return new Date(etapa.fimReal) > fimPrev;
  return hoje > fimPrev && etapa.progresso < 100;
}

/** Dias de atraso (0 se em dia). */
export function diasAtraso(etapa: EtapaLike, hoje = new Date()): number {
  if (!etapaAtrasada(etapa, hoje)) return 0;
  const fimPrev = new Date(etapa.fimPrev);
  const ref = etapa.fimReal ? new Date(etapa.fimReal) : hoje;
  return Math.max(0, diferencaDias(fimPrev, ref));
}

export type StatusProjetoCalc =
  | "PLANEJAMENTO"
  | "EM_ANDAMENTO"
  | "PAUSADA"
  | "CONCLUIDA"
  | "ATRASADA";

/** Status calculado do projeto (a partir das datas, etapas e status manual). */
export function statusCalculadoProjeto(
  statusManual: string,
  inicioPrev: Date | string,
  fimPrev: Date | string,
  etapas: EtapaLike[],
  hoje = new Date()
): StatusProjetoCalc {
  if (projetoConcluido(statusManual, etapas)) return "CONCLUIDA";
  if (statusManual === "PAUSADA") return "PAUSADA";
  const ini = new Date(inicioPrev);
  const fim = new Date(fimPrev);
  if (hoje < ini) return "PLANEJAMENTO";
  const temAtraso = hoje > fim || etapas.some((e) => etapaAtrasada(e, hoje));
  if (temAtraso) return "ATRASADA";
  return "EM_ANDAMENTO";
}

/** Status automático de uma ETAPA. */
export function statusCalculadoEtapa(
  etapa: { inicioPrev: Date | string; fimPrev: Date | string; fimReal?: Date | string | null; progresso: number },
  hoje = new Date()
): "PLANEJADA" | "EM_ANDAMENTO" | "CONCLUIDA" | "ATRASADA" {
  if (etapa.progresso >= 100) return "CONCLUIDA";
  if (hoje < new Date(etapa.inicioPrev)) return "PLANEJADA";
  if (etapaAtrasada(etapa, hoje)) return "ATRASADA";
  return "EM_ANDAMENTO";
}

type Tone = "default" | "info" | "success" | "danger" | "warning";

export const STATUS_LABEL: Record<string, string> = {
  PLANEJAMENTO: "Planejamento",
  PLANEJADA: "Planejada",
  EM_ANDAMENTO: "Em andamento",
  PAUSADA: "Pausada",
  CONCLUIDA: "Concluída",
  ATRASADA: "Atrasada",
};

export const STATUS_TONE: Record<string, Tone> = {
  PLANEJAMENTO: "default",
  PLANEJADA: "default",
  EM_ANDAMENTO: "info",
  PAUSADA: "warning",
  CONCLUIDA: "success",
  ATRASADA: "danger",
};

export const TIPOS_PROJETO = [
  "Residencial",
  "Comercial",
  "Reforma",
  "Projeto arquitetônico",
  "Interiores",
  "Industrial",
  "Outro",
] as const;

export const STATUS_SUBETAPA_LABEL: Record<string, string> = {
  PENDENTE: "Pendente",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
};

export const STATUS_SUBETAPA_TONE: Record<string, Tone> = {
  PENDENTE: "default",
  EM_ANDAMENTO: "warning",
  CONCLUIDA: "success",
};
