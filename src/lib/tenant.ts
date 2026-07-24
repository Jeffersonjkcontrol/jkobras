// Regras de acesso do escritório (tenant): conta desativada ou período de teste vencido.

type Tone = "default" | "info" | "success" | "danger" | "warning";

export type OrgAcesso = { ativa: boolean; trialAte: Date | string | null };

/** Dias que faltam para o fim do teste. null = conta permanente. Negativo = vencido. */
export function diasRestantesTrial(trialAte: Date | string | null | undefined, hoje = new Date()): number | null {
  if (!trialAte) return null;
  const fim = new Date(trialAte).getTime();
  return Math.ceil((fim - hoje.getTime()) / (24 * 60 * 60 * 1000));
}

/** True se existe prazo de teste e ele já passou. */
export function trialExpirado(trialAte: Date | string | null | undefined, hoje = new Date()): boolean {
  if (!trialAte) return false;
  return new Date(trialAte).getTime() < hoje.getTime();
}

/** True se o escritório não pode usar o sistema (desativado ou teste vencido). */
export function orgBloqueada(org: OrgAcesso | null | undefined, hoje = new Date()): boolean {
  if (!org) return true;
  if (!org.ativa) return true;
  return trialExpirado(org.trialAte, hoje);
}

/** Motivo do bloqueio, para a tela de aviso. */
export function motivoBloqueio(org: OrgAcesso | null | undefined, hoje = new Date()): "INATIVA" | "TRIAL_EXPIRADO" | null {
  if (!org) return "INATIVA";
  if (!org.ativa) return "INATIVA";
  if (trialExpirado(org.trialAte, hoje)) return "TRIAL_EXPIRADO";
  return null;
}

/** Rótulo + tom para exibir a situação de acesso no painel do super-admin. */
export function situacaoAcesso(
  org: OrgAcesso,
  hoje = new Date()
): { label: string; tone: Tone; dias: number | null } {
  const dias = diasRestantesTrial(org.trialAte, hoje);
  if (!org.ativa) return { label: "Desativado", tone: "danger", dias };
  if (dias === null) return { label: "Permanente", tone: "success", dias: null };
  if (dias < 0) return { label: "Teste expirado", tone: "danger", dias };
  if (dias === 0) return { label: "Último dia de teste", tone: "warning", dias };
  if (dias <= 7) return { label: `Teste — ${dias} dia(s)`, tone: "warning", dias };
  return { label: `Teste — ${dias} dias`, tone: "info", dias };
}
