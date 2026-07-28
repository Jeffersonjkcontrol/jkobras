import type { Papel } from "@prisma/client";

/**
 * Modelo de permissões (RBAC).
 * - USUARIO: leitura + preenche Diário de Obra (RDO).
 * - GESTOR: cria/edita clientes, projetos, etapas.
 * - ADMIN: tudo + gestão de usuários.
 */
export const PAPEL_LABEL: Record<Papel, string> = {
  SUPER_ADMIN: "Super Admin",
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

export function ehSuperAdmin(papel: Papel | undefined | null): boolean {
  return papel === "SUPER_ADMIN";
}

/**
 * Permissões de VISUALIZAÇÃO por usuário (o papel acima controla a escrita).
 * Servem para esconder dados sensíveis de quem não precisa deles — ex.: o
 * encarregado que só preenche RDO não vê custo de mão de obra, CPF nem PIX.
 * O ADMIN da organização recebe sempre TODAS_PERMISSOES.
 */
export type Permissoes = {
  financeiro: boolean; // financeiro do projeto, honorários e valor do contrato
  orcamentos: boolean; // propostas e valores ao cliente
  custosEquipe: boolean; // CPF, PIX, telefone e quanto cada profissional recebe
  docsRestritos: boolean; // documentos marcados como restritos
};

export const TODAS_PERMISSOES: Permissoes = {
  financeiro: true,
  orcamentos: true,
  custosEquipe: true,
  docsRestritos: true,
};

export const PERMISSAO_LABEL: Record<keyof Permissoes, string> = {
  financeiro: "Financeiro e honorários",
  orcamentos: "Orçamentos",
  custosEquipe: "Custos e dados da equipe",
  docsRestritos: "Documentos restritos",
};
