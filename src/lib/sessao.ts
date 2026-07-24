import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { podeEditar, ehAdmin } from "@/lib/permissoes";
import { orgBloqueada } from "@/lib/tenant";
import type { Papel } from "@prisma/client";

export type SessaoOrg = { userId: string; papel: Papel; organizacaoId: string; nome: string };

/** Sessão do tenant. Lança se não houver sessão ou se o usuário não tiver organização
 *  (ex.: SUPER_ADMIN não usa as telas do tenant — deve ir para /admin). */
export async function sessaoOrg(): Promise<SessaoOrg> {
  const session = await auth();
  if (!session?.user) throw new Error("Não autenticado.");
  if (!session.user.organizacaoId) throw new Error("Usuário sem organização.");
  return {
    userId: session.user.id,
    papel: session.user.papel,
    organizacaoId: session.user.organizacaoId,
    nome: session.user.name ?? "Usuário",
  };
}

/** Recusa qualquer escrita se o escritório estiver desativado ou com o teste vencido.
 *  (A leitura é barrada antes, no layout, que redireciona para /expirado.) */
async function exigirOrgLiberada(organizacaoId: string): Promise<void> {
  const org = await prisma.organizacao.findUnique({
    where: { id: organizacaoId },
    select: { ativa: true, trialAte: true },
  });
  if (orgBloqueada(org)) throw new Error("Escritório sem acesso ativo (período de teste encerrado ou conta desativada).");
}

/** Exige sessão de tenant + permissão de escrita (ADMIN/GESTOR). Retorna a sessão. */
export async function exigirGestorDaOrg(): Promise<SessaoOrg> {
  const s = await sessaoOrg();
  if (!podeEditar(s.papel)) throw new Error("Sem permissão.");
  await exigirOrgLiberada(s.organizacaoId);
  return s;
}

/** Exige sessão de tenant + ADMIN da organização. */
export async function exigirAdminDaOrg(): Promise<SessaoOrg> {
  const s = await sessaoOrg();
  if (!ehAdmin(s.papel)) throw new Error("Sem permissão.");
  await exigirOrgLiberada(s.organizacaoId);
  return s;
}
