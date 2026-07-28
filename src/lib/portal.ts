// Portal do cliente: resolve o token secreto do link em um projeto/organização.
// É a função irmã de `sessaoOrg()` para quem NÃO tem login — todo acesso público
// passa por aqui, e daqui em diante vale o mesmo escopo `{ id, organizacaoId }`.
import { randomBytes } from "crypto";
import { prisma } from "./prisma";
import { orgBloqueada } from "./tenant";

export type PortalValido = {
  portalId: string;
  token: string;
  projetoId: string;
  organizacaoId: string;
  mostrarCronograma: boolean;
  mostrarDiario: boolean;
  mostrarDocumentos: boolean;
  mostrarAprovacoes: boolean;
};

export type MotivoBloqueio = "NAO_ENCONTRADO" | "REVOGADO" | "EXPIRADO" | "INDISPONIVEL";

export type ResultadoPortal = { ok: true; portal: PortalValido } | { ok: false; motivo: MotivoBloqueio };

/** Token secreto do link. randomBytes (não cuid, que é sequencial e adivinhável). */
export function gerarToken(): string {
  return randomBytes(24).toString("base64url"); // ~32 caracteres
}

/** Resolve o token e valida: link ativo, dentro do prazo, e escritório liberado. */
export async function portalPorToken(token: string): Promise<ResultadoPortal> {
  if (!token || token.length < 16) return { ok: false, motivo: "NAO_ENCONTRADO" };

  const p = await prisma.portalCliente.findUnique({
    where: { token },
    select: {
      id: true,
      token: true,
      ativo: true,
      expiraEm: true,
      projetoId: true,
      organizacaoId: true,
      mostrarCronograma: true,
      mostrarDiario: true,
      mostrarDocumentos: true,
      mostrarAprovacoes: true,
    },
  });
  if (!p) return { ok: false, motivo: "NAO_ENCONTRADO" };
  if (!p.ativo) return { ok: false, motivo: "REVOGADO" };
  if (p.expiraEm && p.expiraEm.getTime() < Date.now()) return { ok: false, motivo: "EXPIRADO" };

  // O escritório precisa estar ativo e com o acesso em dia (mesma regra do app).
  const org = await prisma.organizacao.findUnique({
    where: { id: p.organizacaoId },
    select: { ativa: true, trialAte: true },
  });
  if (orgBloqueada(org)) return { ok: false, motivo: "INDISPONIVEL" };

  return {
    ok: true,
    portal: {
      portalId: p.id,
      token: p.token,
      projetoId: p.projetoId,
      organizacaoId: p.organizacaoId,
      mostrarCronograma: p.mostrarCronograma,
      mostrarDiario: p.mostrarDiario,
      mostrarDocumentos: p.mostrarDocumentos,
      mostrarAprovacoes: p.mostrarAprovacoes,
    },
  };
}

/** Contabiliza a visita (best-effort — nunca quebra a página do cliente). */
export async function registrarVisita(portalId: string): Promise<void> {
  await prisma.portalCliente
    .update({ where: { id: portalId }, data: { visitas: { increment: 1 }, ultimoAcessoEm: new Date() } })
    .catch(() => {});
}
