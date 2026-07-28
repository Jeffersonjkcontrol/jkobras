"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sessaoOrg, exigirGestorCom } from "@/lib/sessao";
import { podeEditar } from "@/lib/permissoes";

async function projetoDaOrg(projetoId: string, organizacaoId: string) {
  const p = await prisma.projeto.findFirst({ where: { id: projetoId, organizacaoId }, select: { id: true } });
  if (!p) throw new Error("Projeto não encontrado.");
}

const horasSchema = z.object({
  projetoId: z.string().min(1),
  data: z.string().min(1, "Informe a data."),
  horas: z.coerce.number().positive("Informe as horas."),
  descricao: z.string().optional(),
  valorHora: z.coerce.number().min(0).optional(),
  etapaId: z.string().optional(),
  userId: z.string().optional(),
});

function lerHoras(formData: FormData) {
  const vh = formData.get("valorHora");
  return horasSchema.parse({
    projetoId: formData.get("projetoId"),
    data: formData.get("data"),
    horas: formData.get("horas"),
    descricao: (formData.get("descricao") as string) || undefined,
    valorHora: vh ? Number(vh) : undefined,
    etapaId: (formData.get("etapaId") as string) || undefined,
    userId: (formData.get("userId") as string) || undefined,
  });
}

/** Confere que a etapa (fase) escolhida é do mesmo projeto/organização. */
async function etapaDaOrg(etapaId: string | undefined, projetoId: string, organizacaoId: string) {
  if (!etapaId) return;
  const e = await prisma.etapaProjeto.findFirst({ where: { id: etapaId, projetoId, organizacaoId }, select: { id: true } });
  if (!e) throw new Error("Fase inválida.");
}

async function usuarioDaOrg(userId: string | undefined, organizacaoId: string) {
  if (!userId) return;
  const u = await prisma.user.findFirst({ where: { id: userId, organizacaoId }, select: { id: true } });
  if (!u) throw new Error("Usuário inválido.");
}

export async function criarApontamento(formData: FormData) {
  // Qualquer usuário do escritório pode apontar as próprias horas.
  const s = await sessaoOrg();
  const d = lerHoras(formData);
  await projetoDaOrg(d.projetoId, s.organizacaoId);
  await etapaDaOrg(d.etapaId, d.projetoId, s.organizacaoId);

  // Só gestor/admin pode lançar horas em nome de outra pessoa.
  const alvo = d.userId && podeEditar(s.papel) ? d.userId : s.userId;
  await usuarioDaOrg(alvo, s.organizacaoId);

  await prisma.apontamentoHoras.create({
    data: {
      organizacaoId: s.organizacaoId,
      projetoId: d.projetoId,
      data: new Date(d.data),
      horas: d.horas,
      descricao: d.descricao ?? null,
      // Sem permissão de financeiro a pessoa não define valor/hora.
      valorHora: s.perm.financeiro ? d.valorHora ?? null : null,
      etapaId: d.etapaId || null,
      userId: alvo,
    },
  });
  revalidatePath(`/projetos/${d.projetoId}/arquitetura`);
}

export async function atualizarApontamento(formData: FormData) {
  const s = await sessaoOrg();
  const id = String(formData.get("id"));
  const d = lerHoras(formData);
  await etapaDaOrg(d.etapaId, d.projetoId, s.organizacaoId);

  // Usuário comum só edita o próprio apontamento.
  const where = podeEditar(s.papel)
    ? { id, organizacaoId: s.organizacaoId }
    : { id, organizacaoId: s.organizacaoId, userId: s.userId };

  await prisma.apontamentoHoras.updateMany({
    where,
    data: {
      data: new Date(d.data),
      horas: d.horas,
      descricao: d.descricao ?? null,
      // Sem permissão de financeiro, o valor/hora existente é preservado.
      ...(s.perm.financeiro ? { valorHora: d.valorHora ?? null } : {}),
      etapaId: d.etapaId || null,
    },
  });
  revalidatePath(`/projetos/${d.projetoId}/arquitetura`);
}

export async function excluirApontamento(formData: FormData) {
  const s = await sessaoOrg();
  const id = String(formData.get("id"));
  const projetoId = String(formData.get("projetoId"));
  const where = podeEditar(s.papel)
    ? { id, organizacaoId: s.organizacaoId }
    : { id, organizacaoId: s.organizacaoId, userId: s.userId };
  await prisma.apontamentoHoras.deleteMany({ where });
  revalidatePath(`/projetos/${projetoId}/arquitetura`);
}

/** Lança os honorários (horas × valor/hora) como RECEITA no Financeiro. */
export async function gerarReceitaHonorarios(formData: FormData) {
  const s = await exigirGestorCom("financeiro");
  const projetoId = String(formData.get("projetoId"));
  await projetoDaOrg(projetoId, s.organizacaoId);

  const apontamentos = await prisma.apontamentoHoras.findMany({
    where: { projetoId, organizacaoId: s.organizacaoId },
    select: { horas: true, valorHora: true },
  });
  const total = apontamentos.reduce((sum, a) => sum + a.horas * (a.valorHora ?? 0), 0);
  if (total <= 0) throw new Error("Não há horas com valor/hora para lançar.");

  const totalHoras = apontamentos.reduce((sum, a) => sum + a.horas, 0);
  await prisma.lancamentoFinanceiro.create({
    data: {
      organizacaoId: s.organizacaoId,
      projetoId,
      descricao: `Honorários de projeto — ${totalHoras.toFixed(1)}h`,
      tipo: "RECEITA",
      status: "REALIZADO",
      categoria: "Projeto / Arquitetura",
      valor: total,
      data: new Date(),
    },
  });
  revalidatePath(`/projetos/${projetoId}/financeiro`);
  revalidatePath(`/projetos/${projetoId}/arquitetura`);
}
