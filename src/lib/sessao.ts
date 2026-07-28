import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { podeEditar, ehAdmin, TODAS_PERMISSOES, type Permissoes } from "@/lib/permissoes";
import { orgBloqueada } from "@/lib/tenant";
import type { Papel } from "@prisma/client";

export type SessaoOrg = {
  userId: string;
  papel: Papel;
  organizacaoId: string;
  nome: string;
  /** true quando é o super-admin simulando (impersonando) um escritório. */
  impersonando?: boolean;
  /** O que este usuário pode VER (o papel controla o que ele pode editar). */
  perm: Permissoes;
};

/** Sessão do tenant. Lança se não houver sessão ou se o usuário não tiver organização
 *  (ex.: SUPER_ADMIN não usa as telas do tenant — deve ir para /admin).
 *  Exceção: super-admin impersonando um escritório age como ADMIN daquela org.
 *
 *  As permissões vêm do BANCO (não do token) para valerem na hora: se o admin
 *  desmarcar uma caixa, o acesso fecha no próximo clique, sem precisar relogar. */
export async function sessaoOrg(): Promise<SessaoOrg> {
  const session = await auth();
  if (!session?.user) throw new Error("Não autenticado.");
  const u = session.user;

  if (u.papel === "SUPER_ADMIN" && u.impersonandoOrgId) {
    return {
      userId: u.id,
      papel: "ADMIN",
      organizacaoId: u.impersonandoOrgId,
      nome: u.name ?? "Super Admin",
      impersonando: true,
      perm: TODAS_PERMISSOES,
    };
  }

  if (!u.organizacaoId) throw new Error("Usuário sem organização.");

  // ADMIN da organização enxerga tudo — não faz sentido trancá-lo fora.
  if (ehAdmin(u.papel)) {
    return { userId: u.id, papel: u.papel, organizacaoId: u.organizacaoId, nome: u.name ?? "Usuário", perm: TODAS_PERMISSOES };
  }

  const flags = await prisma.user.findUnique({
    where: { id: u.id },
    select: { verFinanceiro: true, verOrcamentos: true, verCustosEquipe: true, verDocsRestritos: true },
  });

  return {
    userId: u.id,
    papel: u.papel,
    organizacaoId: u.organizacaoId,
    nome: u.name ?? "Usuário",
    perm: {
      financeiro: flags?.verFinanceiro ?? false,
      orcamentos: flags?.verOrcamentos ?? false,
      custosEquipe: flags?.verCustosEquipe ?? false,
      docsRestritos: flags?.verDocsRestritos ?? false,
    },
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

/** Exige escrita + uma permissão específica de área (ex.: mexer no financeiro). */
export async function exigirGestorCom(area: keyof Permissoes): Promise<SessaoOrg> {
  const s = await exigirGestorDaOrg();
  if (!s.perm[area]) throw new Error("Você não tem permissão para acessar esta área.");
  return s;
}
