"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth, unstable_update } from "@/auth";
import { ehSuperAdmin } from "@/lib/permissoes";
import { presetPorNome } from "@/lib/planos";
import type { StatusPagamento } from "@prisma/client";

/** Garante super-admin e devolve o e-mail (para registrar no log). */
async function exigirSuperAdmin(): Promise<string> {
  const session = await auth();
  if (!session?.user || !ehSuperAdmin(session.user.papel)) throw new Error("Sem permissão.");
  return session.user.email ?? "super-admin";
}

/** Registra uma ação do super-admin no log de auditoria. */
async function logAdmin(ator: string, acao: string, orgId: string | null, orgNome: string | null, detalhe?: string) {
  await prisma.adminLog.create({ data: { atorEmail: ator, acao, organizacaoId: orgId, orgNome, detalhe: detalhe ?? null } });
}

const DIACRITICOS = /[̀-ͯ]/g;
function slugify(s: string): string {
  const base = s.normalize("NFD").replace(DIACRITICOS, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
  return base || "escritorio";
}

// ------------------------------------------------------------ Situação/acesso
export async function alternarOrgAtiva(formData: FormData) {
  const ator = await exigirSuperAdmin();
  const id = String(formData.get("id"));
  const org = await prisma.organizacao.findUnique({ where: { id }, select: { ativa: true, nome: true } });
  if (!org) return;
  await prisma.organizacao.update({ where: { id }, data: { ativa: !org.ativa } });
  await logAdmin(ator, org.ativa ? "desativou" : "ativou", id, org.nome);
  revalidatePath("/admin");
  revalidatePath(`/admin/${id}`);
}

export async function definirTrial(formData: FormData) {
  const ator = await exigirSuperAdmin();
  const id = String(formData.get("id"));
  const dias = String(formData.get("dias") || "").trim();
  const data = String(formData.get("data") || "").trim();

  let fim: Date;
  if (dias) {
    const n = Number(dias);
    if (!Number.isFinite(n) || n < 0) throw new Error("Número de dias inválido.");
    fim = new Date();
    fim.setDate(fim.getDate() + n);
  } else if (data) {
    fim = new Date(data);
    if (Number.isNaN(fim.getTime())) throw new Error("Data inválida.");
  } else {
    throw new Error("Informe os dias ou a data final do teste.");
  }
  fim.setHours(23, 59, 59, 999);

  const org = await prisma.organizacao.update({ where: { id }, data: { trialAte: fim, ativa: true }, select: { nome: true } });
  await logAdmin(ator, "definiu_teste", id, org.nome, `até ${fim.toISOString().slice(0, 10)}`);
  revalidatePath("/admin");
  revalidatePath(`/admin/${id}`);
}

export async function tornarPermanente(formData: FormData) {
  const ator = await exigirSuperAdmin();
  const id = String(formData.get("id"));
  const org = await prisma.organizacao.update({ where: { id }, data: { trialAte: null, ativa: true }, select: { nome: true } });
  await logAdmin(ator, "tornou_permanente", id, org.nome);
  revalidatePath("/admin");
  revalidatePath(`/admin/${id}`);
}

export async function excluirOrg(formData: FormData) {
  const ator = await exigirSuperAdmin();
  const id = String(formData.get("id"));
  const org = await prisma.organizacao.findUnique({ where: { id }, select: { nome: true } });
  await prisma.organizacao.delete({ where: { id } });
  await logAdmin(ator, "excluiu", null, org?.nome ?? null);
  revalidatePath("/admin");
  redirect("/admin");
}

// ------------------------------------------------------------------- Plano
const planoSchema = z.object({
  id: z.string().min(1),
  plano: z.string().min(1),
  limiteProjetos: z.coerce.number().int().min(0).optional(),
  limiteUsuarios: z.coerce.number().int().min(0).optional(),
  limiteArmazenamentoMB: z.coerce.number().int().min(0).optional(),
});

export async function salvarPlano(formData: FormData) {
  const ator = await exigirSuperAdmin();
  const lp = formData.get("limiteProjetos");
  const lu = formData.get("limiteUsuarios");
  const la = formData.get("limiteArmazenamentoMB");
  const d = planoSchema.parse({
    id: formData.get("id"),
    plano: formData.get("plano"),
    limiteProjetos: lp ? Number(lp) : undefined,
    limiteUsuarios: lu ? Number(lu) : undefined,
    limiteArmazenamentoMB: la ? Number(la) : undefined,
  });
  const org = await prisma.organizacao.update({
    where: { id: d.id },
    data: {
      plano: d.plano,
      limiteProjetos: d.limiteProjetos ?? null,
      limiteUsuarios: d.limiteUsuarios ?? null,
      limiteArmazenamentoMB: d.limiteArmazenamentoMB ?? null,
    },
    select: { nome: true },
  });
  await logAdmin(ator, "definiu_plano", d.id, org.nome, d.plano);
  revalidatePath(`/admin/${d.id}`);
  revalidatePath("/admin");
}

/** Aplica um plano pré-definido (preço + limites de uma vez). */
export async function aplicarPreset(formData: FormData) {
  const ator = await exigirSuperAdmin();
  const id = String(formData.get("id"));
  const preset = presetPorNome(String(formData.get("preset")));
  if (!preset) throw new Error("Plano inválido.");
  const org = await prisma.organizacao.update({
    where: { id },
    data: {
      plano: preset.nome,
      precoMensal: preset.precoMensal,
      limiteProjetos: preset.limiteProjetos,
      limiteUsuarios: preset.limiteUsuarios,
      limiteArmazenamentoMB: preset.limiteArmazenamentoMB,
    },
    select: { nome: true },
  });
  await logAdmin(ator, "aplicou_plano", id, org.nome, `${preset.nome} (R$ ${preset.precoMensal})`);
  revalidatePath(`/admin/${id}`);
  revalidatePath("/admin");
}

// -------------------------------------------------------------- Comercial
const STATUS_PG: StatusPagamento[] = ["EM_DIA", "PENDENTE", "ISENTO"];
const comercialSchema = z.object({
  id: z.string().min(1),
  statusPagamento: z.enum(["EM_DIA", "PENDENTE", "ISENTO"]),
  precoMensal: z.coerce.number().min(0).optional(),
  proximoVencimento: z.string().optional(),
  notasInternas: z.string().optional(),
  contatoNome: z.string().optional(),
  contatoTelefone: z.string().optional(),
  contatoEmail: z.string().optional(),
});

export async function salvarComercial(formData: FormData) {
  const ator = await exigirSuperAdmin();
  const status = String(formData.get("statusPagamento") || "EM_DIA") as StatusPagamento;
  const preco = formData.get("precoMensal");
  const d = comercialSchema.parse({
    id: formData.get("id"),
    statusPagamento: STATUS_PG.includes(status) ? status : "EM_DIA",
    precoMensal: preco ? Number(preco) : undefined,
    proximoVencimento: (formData.get("proximoVencimento") as string) || undefined,
    notasInternas: (formData.get("notasInternas") as string) || undefined,
    contatoNome: (formData.get("contatoNome") as string) || undefined,
    contatoTelefone: (formData.get("contatoTelefone") as string) || undefined,
    contatoEmail: (formData.get("contatoEmail") as string) || undefined,
  });
  const org = await prisma.organizacao.update({
    where: { id: d.id },
    data: {
      statusPagamento: d.statusPagamento,
      precoMensal: d.precoMensal ?? null,
      proximoVencimento: d.proximoVencimento ? new Date(d.proximoVencimento) : null,
      notasInternas: d.notasInternas ?? null,
      contatoNome: d.contatoNome ?? null,
      contatoTelefone: d.contatoTelefone ?? null,
      contatoEmail: d.contatoEmail ?? null,
    },
    select: { nome: true },
  });
  await logAdmin(ator, "atualizou_comercial", d.id, org.nome, d.statusPagamento);
  revalidatePath(`/admin/${d.id}`);
  revalidatePath("/admin");
}

// ------------------------------------------------------- Criar escritório
const criarSchema = z.object({
  escritorio: z.string().min(1, "Informe o nome do escritório."),
  nome: z.string().min(1, "Informe o nome do responsável."),
  email: z.string().email("E-mail inválido."),
  senha: z.string().min(6, "A senha deve ter ao menos 6 caracteres."),
});

export async function criarEscritorio(formData: FormData) {
  const ator = await exigirSuperAdmin();
  const d = criarSchema.parse({
    escritorio: formData.get("escritorio"),
    nome: formData.get("nome"),
    email: formData.get("email"),
    senha: formData.get("senha"),
  });
  const email = d.email.toLowerCase();
  if (await prisma.user.findUnique({ where: { email } })) throw new Error("Este e-mail já está em uso.");

  const base = slugify(d.escritorio);
  let slug = base;
  let i = 1;
  while (await prisma.organizacao.findUnique({ where: { slug } })) slug = `${base}-${++i}`;

  const org = await prisma.organizacao.create({ data: { nome: d.escritorio, slug } });
  await prisma.user.create({
    data: {
      organizacaoId: org.id,
      nome: d.nome,
      email,
      senhaHash: await bcrypt.hash(d.senha, 10),
      papel: "ADMIN",
      ativo: true,
      recebeNotificacoes: true,
    },
  });
  await logAdmin(ator, "criou_escritorio", org.id, d.escritorio, email);
  revalidatePath("/admin");
  redirect(`/admin/${org.id}`);
}

// -------------------------------------------------- Redefinir senha de usuário
const senhaSchema = z.object({
  userId: z.string().min(1),
  orgId: z.string().min(1),
  novaSenha: z.string().min(6, "A senha deve ter ao menos 6 caracteres."),
});

export async function redefinirSenhaUsuario(formData: FormData) {
  const ator = await exigirSuperAdmin();
  const d = senhaSchema.parse({
    userId: formData.get("userId"),
    orgId: formData.get("orgId"),
    novaSenha: formData.get("novaSenha"),
  });
  const alvo = await prisma.user.findFirst({ where: { id: d.userId, organizacaoId: d.orgId }, select: { email: true } });
  if (!alvo) throw new Error("Usuário não encontrado neste escritório.");
  await prisma.user.update({ where: { id: d.userId }, data: { senhaHash: await bcrypt.hash(d.novaSenha, 10) } });
  await logAdmin(ator, "redefiniu_senha", d.orgId, null, alvo.email);
  revalidatePath(`/admin/${d.orgId}`);
}

// ---------------------------------------------------- Impersonação (suporte)
export async function entrarComo(formData: FormData) {
  const ator = await exigirSuperAdmin();
  const id = String(formData.get("id"));
  const org = await prisma.organizacao.findUnique({ where: { id }, select: { nome: true } });
  if (!org) throw new Error("Escritório não encontrado.");
  await logAdmin(ator, "impersonou", id, org.nome);
  await unstable_update({ impersonandoOrgId: id } as unknown as Parameters<typeof unstable_update>[0]);
  redirect("/");
}

export async function sairSimulacao() {
  await auth(); // garante sessão
  await unstable_update({ impersonandoOrgId: null } as unknown as Parameters<typeof unstable_update>[0]);
  redirect("/admin");
}
