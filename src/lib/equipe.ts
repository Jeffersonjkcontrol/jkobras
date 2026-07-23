// Helpers do módulo Equipe / Mão de obra.
import { formatarMoeda } from "./utils";

type Tone = "default" | "info" | "success" | "danger" | "warning";

// Funções sugeridas (campo é texto livre — aceita outras).
export const FUNCOES = [
  "Empreiteiro",
  "Mestre de obras",
  "Pedreiro",
  "Servente / Ajudante",
  "Encanador",
  "Eletricista",
  "Pintor",
  "Carpinteiro",
  "Armador",
  "Azulejista / Ladrilheiro",
  "Gesseiro",
  "Serralheiro",
  "Vidraceiro",
  "Marceneiro",
  "Arquiteto",
  "Engenheiro",
  "Outro",
] as const;

export const TIPO_CUSTO = ["DIARIA", "HORA", "EMPREITADA", "MENSALISTA"] as const;

export const TIPO_CUSTO_LABEL: Record<string, string> = {
  DIARIA: "Diária",
  HORA: "Por hora",
  EMPREITADA: "Empreitada",
  MENSALISTA: "Mensalista",
};

// Sufixo exibido junto ao valor (ex.: R$ 150,00 /dia).
export const TIPO_CUSTO_SUFIXO: Record<string, string> = {
  DIARIA: " /dia",
  HORA: " /h",
  EMPREITADA: "",
  MENSALISTA: " /mês",
};

export const STATUS_TAREFA = ["PENDENTE", "EM_ANDAMENTO", "CONCLUIDA"] as const;

export const STATUS_TAREFA_LABEL: Record<string, string> = {
  PENDENTE: "Pendente",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
};

export const STATUS_TAREFA_TONE: Record<string, Tone> = {
  PENDENTE: "default",
  EM_ANDAMENTO: "warning",
  CONCLUIDA: "success",
};

/** Formata o custo com o sufixo do tipo (ex.: "R$ 150,00 /dia"). */
export function formatarCusto(tipo: string, valor: number | null | undefined): string {
  if (valor == null) return "—";
  return `${formatarMoeda(valor)}${TIPO_CUSTO_SUFIXO[tipo] ?? ""}`;
}
