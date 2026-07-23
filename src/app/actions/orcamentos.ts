"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirGestorDaOrg } from "@/lib/sessao";
import type { StatusOrcamento } from "@prisma/client";

/** Garante que o projeto é da organização. */
async function projetoDaOrg(projetoId: string, organizacaoId: string) {
  const p = await prisma.projeto.findFirst({ where: { id: projetoId, organizacaoId }, select: { id: true } });
  if (!p) throw new Error("Projeto não encontrado.");
}

/** Garante que o orçamento é da organização e retorna o projetoId (para revalidar/redirecionar). */
async function orcamentoDaOrg(orcamentoId: string, organizacaoId: string): Promise<string> {
  const o = await prisma.orcamento.findFirst({ where: { id: orcamentoId, organizacaoId }, select: { projetoId: true } });
  if (!o) throw new Error("Orçamento não encontrado.");
  return o.projetoId;
}

// ---- Orçamento ----
const orcamentoSchema = z.object({
  projetoId: z.string().min(1),
  titulo: z.string().min(1, "Informe o título."),
  observacoes: z.string().optional(),
  validadeDias: z.coerce.number().int().min(0).optional(),
});

export async function criarOrcamento(formData: FormData) {
  const s = await exigirGestorDaOrg();
  const validade = formData.get("validadeDias");
  const d = orcamentoSchema.parse({
    projetoId: formData.get("projetoId"),
    titulo: formData.get("titulo"),
    observacoes: (formData.get("observacoes") as string) || undefined,
    validadeDias: validade ? Number(validade) : undefined,
  });
  await projetoDaOrg(d.projetoId, s.organizacaoId);
  const orc = await prisma.orcamento.create({
    data: {
      organizacaoId: s.organizacaoId,
      projetoId: d.projetoId,
      titulo: d.titulo,
      observacoes: d.observacoes,
      validadeDias: d.validadeDias ?? null,
    },
  });
  revalidatePath(`/projetos/${d.projetoId}/orcamentos`);
  redirect(`/projetos/${d.projetoId}/orcamentos/${orc.id}`);
}

export async function atualizarOrcamento(formData: FormData) {
  const s = await exigirGestorDaOrg();
  const id = String(formData.get("id"));
  const validade = formData.get("validadeDias");
  const d = orcamentoSchema.parse({
    projetoId: formData.get("projetoId"),
    titulo: formData.get("titulo"),
    observacoes: (formData.get("observacoes") as string) || undefined,
    validadeDias: validade ? Number(validade) : undefined,
  });
  await prisma.orcamento.updateMany({
    where: { id, organizacaoId: s.organizacaoId },
    data: { titulo: d.titulo, observacoes: d.observacoes ?? null, validadeDias: d.validadeDias ?? null },
  });
  revalidatePath(`/projetos/${d.projetoId}/orcamentos/${id}`);
}

const STATUS_OK: StatusOrcamento[] = ["RASCUNHO", "ENVIADO", "APROVADO", "REJEITADO"];

export async function alterarStatusOrcamento(formData: FormData) {
  const s = await exigirGestorDaOrg();
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as StatusOrcamento;
  if (!STATUS_OK.includes(status)) throw new Error("Status inválido.");
  const projetoId = await orcamentoDaOrg(id, s.organizacaoId);
  await prisma.orcamento.updateMany({ where: { id, organizacaoId: s.organizacaoId }, data: { status } });
  revalidatePath(`/projetos/${projetoId}/orcamentos/${id}`);
  revalidatePath(`/projetos/${projetoId}/orcamentos`);
}

export async function excluirOrcamento(formData: FormData) {
  const s = await exigirGestorDaOrg();
  const id = String(formData.get("id"));
  const projetoId = String(formData.get("projetoId"));
  await prisma.orcamento.deleteMany({ where: { id, organizacaoId: s.organizacaoId } });
  revalidatePath(`/projetos/${projetoId}/orcamentos`);
  redirect(`/projetos/${projetoId}/orcamentos`);
}

// ---- Itens do orçamento ----
const itemSchema = z.object({
  orcamentoId: z.string().min(1),
  descricao: z.string().min(1, "Informe a descrição."),
  unidade: z.string().optional(),
  quantidade: z.coerce.number().min(0),
  valorUnitario: z.coerce.number().min(0),
  ordem: z.coerce.number().optional(),
});

function lerItem(formData: FormData) {
  return itemSchema.parse({
    orcamentoId: formData.get("orcamentoId"),
    descricao: formData.get("descricao"),
    unidade: (formData.get("unidade") as string) || undefined,
    quantidade: formData.get("quantidade") ?? 0,
    valorUnitario: formData.get("valorUnitario") ?? 0,
    ordem: formData.get("ordem") ?? 0,
  });
}

export async function adicionarItemOrcamento(formData: FormData) {
  const s = await exigirGestorDaOrg();
  const d = lerItem(formData);
  const projetoId = await orcamentoDaOrg(d.orcamentoId, s.organizacaoId);
  await prisma.itemOrcamento.create({
    data: {
      orcamentoId: d.orcamentoId,
      descricao: d.descricao,
      unidade: d.unidade || "un",
      quantidade: d.quantidade,
      valorUnitario: d.valorUnitario,
      ordem: d.ordem ?? 0,
    },
  });
  revalidatePath(`/projetos/${projetoId}/orcamentos/${d.orcamentoId}`);
}

export async function atualizarItemOrcamento(formData: FormData) {
  const s = await exigirGestorDaOrg();
  const id = String(formData.get("id"));
  const d = lerItem(formData);
  const projetoId = await orcamentoDaOrg(d.orcamentoId, s.organizacaoId);
  await prisma.itemOrcamento.updateMany({
    where: { id, orcamentoId: d.orcamentoId },
    data: {
      descricao: d.descricao,
      unidade: d.unidade || "un",
      quantidade: d.quantidade,
      valorUnitario: d.valorUnitario,
      ordem: d.ordem ?? 0,
    },
  });
  revalidatePath(`/projetos/${projetoId}/orcamentos/${d.orcamentoId}`);
}

export async function excluirItemOrcamento(formData: FormData) {
  const s = await exigirGestorDaOrg();
  const id = String(formData.get("id"));
  const orcamentoId = String(formData.get("orcamentoId"));
  const projetoId = await orcamentoDaOrg(orcamentoId, s.organizacaoId);
  await prisma.itemOrcamento.deleteMany({ where: { id, orcamentoId } });
  revalidatePath(`/projetos/${projetoId}/orcamentos/${orcamentoId}`);
}
