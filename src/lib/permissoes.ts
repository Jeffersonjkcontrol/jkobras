import type { Papel } from "@prisma/client";

/**
 * Modelo de permissões (RBAC).
 * - USUARIO: leitura + preenche Diário de Obra (RDO).
 * - GESTOR: cria/edita clientes, projetos, etapas.
 * - ADMIN: tudo + gestão de usuários.
 */
export const PAPEL_LABEL: Record<Papel, string> = {
  ADMIN: "Administrador",
  GESTOR: "Gestor",
  USUARIO: "Usuário",
};

export function podeEditar(papel: Papel | undefined | null): boolean {
  return papel === "ADMIN" || papel === "GESTOR";
}

export function ehAdmin(papel: Papel | undefined | null): boolean {
  return papel === "ADMIN";
}
