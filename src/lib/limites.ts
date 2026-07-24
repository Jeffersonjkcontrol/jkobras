// Verificação dos limites do plano de cada escritório (definidos pelo super-admin).
// NULL num limite = ilimitado.
import { prisma } from "./prisma";

/** Bloqueia a criação se o escritório já atingiu o limite de projetos. */
export async function checarLimiteProjetos(organizacaoId: string): Promise<void> {
  const org = await prisma.organizacao.findUnique({
    where: { id: organizacaoId },
    select: { limiteProjetos: true },
  });
  if (org?.limiteProjetos == null) return;
  const n = await prisma.projeto.count({ where: { organizacaoId } });
  if (n >= org.limiteProjetos) {
    throw new Error(`Limite do plano atingido (${org.limiteProjetos} projeto(s)). Contate o administrador da plataforma para ampliar.`);
  }
}

/** Bloqueia a criação se o escritório já atingiu o limite de usuários. */
export async function checarLimiteUsuarios(organizacaoId: string): Promise<void> {
  const org = await prisma.organizacao.findUnique({
    where: { id: organizacaoId },
    select: { limiteUsuarios: true },
  });
  if (org?.limiteUsuarios == null) return;
  const n = await prisma.user.count({ where: { organizacaoId } });
  if (n >= org.limiteUsuarios) {
    throw new Error(`Limite do plano atingido (${org.limiteUsuarios} usuário(s)). Contate o administrador da plataforma para ampliar.`);
  }
}

/** Bloqueia o upload se ele estourar o limite de armazenamento do escritório. */
export async function checarLimiteArmazenamento(organizacaoId: string, novoBytes: number): Promise<void> {
  const org = await prisma.organizacao.findUnique({
    where: { id: organizacaoId },
    select: { limiteArmazenamentoMB: true },
  });
  if (org?.limiteArmazenamentoMB == null) return;
  const agg = await prisma.documento.aggregate({ where: { organizacaoId }, _sum: { tamanho: true } });
  const usado = agg._sum.tamanho ?? 0;
  const limite = org.limiteArmazenamentoMB * 1024 * 1024;
  if (usado + novoBytes > limite) {
    throw new Error(`Limite de armazenamento do plano atingido (${org.limiteArmazenamentoMB} MB). Contate o administrador da plataforma.`);
  }
}
