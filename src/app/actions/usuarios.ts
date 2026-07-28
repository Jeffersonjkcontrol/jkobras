"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { exigirAdminDaOrg } from "@/lib/sessao";
import { checarLimiteUsuarios } from "@/lib/limites";

const criarSchema = z.object({
  nome: z.string().min(1, "Informe o nome."),
  email: z.string().email("E-mail inválido."),
  senha: z.string().min(6, "A senha deve ter ao menos 6 caracteres."),
  papel: z.enum(["ADMIN", "GESTOR", "USUARIO"]),
  recebeNotificacoes: z.boolean().optional(),
});

/** Lê as 4 permissões de visualização do formulário (checkbox = "on"). */
function lerPermissoes(formData: FormData) {
  return {
    verFinanceiro: formData.get("verFinanceiro") === "on",
    verOrcamentos: formData.get("verOrcamentos") === "on",
    verCustosEquipe: formData.get("verCustosEquipe") === "on",
    verDocsRestritos: formData.get("verDocsRestritos") === "on",
  };
}

export async function criarUsuario(formData: FormData) {
  const s = await exigirAdminDaOrg();
  await checarLimiteUsuarios(s.organizacaoId);
  const d = criarSchema.parse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    senha: formData.get("senha"),
    papel: formData.get("papel"),
    recebeNotificacoes: formData.get("recebeNotificacoes") === "on",
  });
  if (await prisma.user.findUnique({ where: { email: d.email } })) {
    throw new Error("Já existe um usuário com este e-mail.");
  }
  await prisma.user.create({
    data: {
      organizacaoId: s.organizacaoId,
      nome: d.nome,
      email: d.email,
      senhaHash: await bcrypt.hash(d.senha, 10),
      papel: d.papel,
      recebeNotificacoes: d.recebeNotificacoes ?? false,
      ...lerPermissoes(formData),
    },
  });
  revalidatePath("/usuarios");
}

const atualizarSchema = z.object({
  id: z.string().min(1),
  nome: z.string().min(1),
  email: z.string().email(),
  papel: z.enum(["ADMIN", "GESTOR", "USUARIO"]),
  ativo: z.string().optional(),
  senha: z.string().optional(),
  recebeNotificacoes: z.boolean().optional(),
});

export async function atualizarUsuario(formData: FormData) {
  const s = await exigirAdminDaOrg();
  const d = atualizarSchema.parse({
    id: formData.get("id"),
    nome: formData.get("nome"),
    email: formData.get("email"),
    papel: formData.get("papel"),
    ativo: formData.get("ativo") || undefined,
    senha: (formData.get("senha") as string) || undefined,
    recebeNotificacoes: formData.get("recebeNotificacoes") === "on",
  });
  const data: {
    nome: string;
    email: string;
    papel: "ADMIN" | "GESTOR" | "USUARIO";
    ativo: boolean;
    recebeNotificacoes: boolean;
    senhaHash?: string;
  } = {
    nome: d.nome,
    email: d.email,
    papel: d.papel,
    ativo: d.ativo === "on" || d.ativo === "true",
    recebeNotificacoes: d.recebeNotificacoes ?? false,
  };
  if (d.senha && d.senha.length >= 6) data.senhaHash = await bcrypt.hash(d.senha, 10);
  await prisma.user.updateMany({
    where: { id: d.id, organizacaoId: s.organizacaoId },
    data: { ...data, ...lerPermissoes(formData) },
  });
  revalidatePath("/usuarios");
}

export async function excluirUsuario(formData: FormData) {
  const s = await exigirAdminDaOrg();
  const id = String(formData.get("id"));
  if (id === s.userId) throw new Error("Você não pode excluir o próprio usuário.");
  await prisma.user.deleteMany({ where: { id, organizacaoId: s.organizacaoId } });
  revalidatePath("/usuarios");
}
