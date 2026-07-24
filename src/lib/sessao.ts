import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { podeEditar, ehAdmin } from "@/lib/permissoes";
import { orgBloqueada } from "@/lib/tenant";
import type { Papel } from "@prisma/client";

export type SessaoOrg = {
  userId: string;
  papel: Papel;
  organizacaoId: string;
  nome: string;
  /** true quando é o super-admin simulando (impersonando) um escritório. */
  impersonando?: boolean;
};

/** Sessão do tenant. Lança se não houver sessão ou se o usuário não tiver organização
 *  (ex.: SUPER_ADMIN não usa as telas do tenant — deve ir para /admin).
 *  Exceção: super-admin impersonando um escritório age como ADMIN daquela org. */
export async function sessaoOrg(): Promise<SessaoOrg> {
  const session = await auth();
  if (!session?.user) throw new Error("Não autenticado.");
  const u = session.user;

  if (u.papel === "SUPER_ADMIN" && u.impersonandoOrgId) {
    return { userId: u.id, papel: "ADMIN", organizacaoId: u.impersonandoOrgId, nome: u.name ?? "Super Admin", impersonando: true };
  }

  if (!u.organizacaoId) throw new Error("Usuário sem organização.");
  return {
    userId: u.id,
    papel: u.papel,
    organizacaoId: u.organizacaoId,
    nome: u.name ?? "Usuário",
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

/** Exige sessão de tenant + permissão de escrita (ADMIN/GESTOR). Retorna a sessão.
 *  O super-admin impersonando ignora o bloqueio de acesso (suporte). */
export async function exigirGestorDaOrg(): Promise<SessaoOrg> {
  const s = await sessaoOrg();
  if (!podeEditar(s.papel)) throw new Error("Sem permissão.");
  if (!s.impersonando) await exigirOrgLiberada(s.organizacaoId);
  return s;
}

/** Exige sessão de tenant + ADMIN da organização. */
export async function exigirAdminDaOrg(): Promise<SessaoOrg> {
  const s = await sessaoOrg();
  if (!ehAdmin(s.papel)) throw new Error("Sem permissão.");
  if (!s.impersonando) await exigirOrgLiberada(s.organizacaoId);
  return s;
}
