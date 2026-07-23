"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirGestorDaOrg } from "@/lib/sessao";

async function projetoDaOrg(projetoId: string, organizacaoId: string) {
  const p = await prisma.projeto.findFirst({ where: { id: projetoId, organizacaoId }, select: { id: true } });
  if (!p) throw new Error("Projeto não encontrado.");
}

const lancamentoSchema = z.object({
  projetoId: z.string().min(1),
  descricao: z.string().min(1, "Informe a descrição."),
  tipo: z.enum(["RECEITA", "DESPESA"]),
  status: z.enum(["PREVISTO", "REALIZADO"]),
  categoria: z.string().optional(),
  valor: z.coerce.number().min(0),
  data: z.string().min(1, "Informe a data."),
});

function lerLancamento(formData: FormData) {
  return lancamentoSchema.parse({
    projetoId: formData.get("projetoId"),
    descricao: formData.get("descricao"),
    tipo: formData.get("tipo"),
    status: formData.get("status"),
    categoria: (formData.get("categoria") as string) || undefined,
    valor: formData.get("valor") ?? 0,
    data: formData.get("data"),
  });
}

export async function criarLancamento(formData: FormData) {
  const s = await exigirGestorDaOrg();
  const d = lerLancamento(formData);
  await projetoDaOrg(d.projetoId, s.organizacaoId);
  await prisma.lancamentoFinanceiro.create({
    data: {
      organizacaoId: s.organizacaoId,
      projetoId: d.projetoId,
      descricao: d.descricao,
      tipo: d.tipo,
      status: d.status,
      categoria: d.categoria || null,
      valor: d.valor,
      data: new Date(d.data),
    },
  });
  revalidatePath(`/projetos/${d.projetoId}/financeiro`);
}

export async function atualizarLancamento(formData: FormData) {
  const s = await exigirGestorDaOrg();
  const id = String(formData.get("id"));
  const d = lerLancamento(formData);
  await prisma.lancamentoFinanceiro.updateMany({
    where: { id, organizacaoId: s.organizacaoId },
    data: {
      descricao: d.descricao,
      tipo: d.tipo,
      status: d.status,
      categoria: d.categoria || null,
      valor: d.valor,
      data: new Date(d.data),
    },
  });
  revalidatePath(`/projetos/${d.projetoId}/financeiro`);
}

export async function excluirLancamento(formData: FormData) {
  const s = await exigirGestorDaOrg();
  const id = String(formData.get("id"));
  const projetoId = String(formData.get("projetoId"));
  await prisma.lancamentoFinanceiro.deleteMany({ where: { id, organizacaoId: s.organizacaoId } });
  revalidatePath(`/projetos/${projetoId}/financeiro`);
}
