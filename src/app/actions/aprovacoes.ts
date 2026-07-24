"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirGestorDaOrg } from "@/lib/sessao";
import type { StatusAprovacao } from "@prisma/client";

async function projetoDaOrg(projetoId: string, organizacaoId: string) {
  const p = await prisma.projeto.findFirst({ where: { id: projetoId, organizacaoId }, select: { id: true } });
  if (!p) throw new Error("Projeto não encontrado.");
}

const aprovacaoSchema = z.object({
  projetoId: z.string().min(1),
  orgao: z.string().min(1, "Informe o órgão."),
  descricao: z.string().min(1, "Informe a descrição."),
  numeroProtocolo: z.string().optional(),
  dataProtocolo: z.string().optional(),
  prazo: z.string().optional(),
  status: z.enum(["PREPARACAO", "PROTOCOLADO", "EM_ANALISE", "EXIGENCIA", "APROVADO", "INDEFERIDO"]),
  responsavelId: z.string().optional(),
  observacoes: z.string().optional(),
});

function lerAprovacao(formData: FormData) {
  return aprovacaoSchema.parse({
    projetoId: formData.get("projetoId"),
    orgao: formData.get("orgao"),
    descricao: formData.get("descricao"),
    numeroProtocolo: (formData.get("numeroProtocolo") as string) || undefined,
    dataProtocolo: (formData.get("dataProtocolo") as string) || undefined,
    prazo: (formData.get("prazo") as string) || undefined,
    status: formData.get("status") || "PREPARACAO",
    responsavelId: (formData.get("responsavelId") as string) || undefined,
    observacoes: (formData.get("observacoes") as string) || undefined,
  });
}

function dados(d: ReturnType<typeof lerAprovacao>) {
  return {
    orgao: d.orgao,
    descricao: d.descricao,
    numeroProtocolo: d.numeroProtocolo ?? null,
    dataProtocolo: d.dataProtocolo ? new Date(d.dataProtocolo) : null,
    prazo: d.prazo ? new Date(d.prazo) : null,
    status: d.status as StatusAprovacao,
    responsavelId: d.responsavelId || null,
    observacoes: d.observacoes ?? null,
  };
}

/** Confere que o responsável escolhido é usuário da mesma organização. */
async function responsavelDaOrg(userId: string | null | undefined, organizacaoId: string) {
  if (!userId) return;
  const u = await prisma.user.findFirst({ where: { id: userId, organizacaoId }, select: { id: true } });
  if (!u) throw new Error("Responsável inválido.");
}

export async function criarAprovacao(formData: FormData) {
  const s = await exigirGestorDaOrg();
  const d = lerAprovacao(formData);
  await projetoDaOrg(d.projetoId, s.organizacaoId);
  await responsavelDaOrg(d.responsavelId, s.organizacaoId);
  await prisma.aprovacao.create({
    data: { ...dados(d), organizacaoId: s.organizacaoId, projetoId: d.projetoId },
  });
  revalidatePath(`/projetos/${d.projetoId}/arquitetura`);
}

export async function atualizarAprovacao(formData: FormData) {
  const s = await exigirGestorDaOrg();
  const id = String(formData.get("id"));
  const d = lerAprovacao(formData);
  await responsavelDaOrg(d.responsavelId, s.organizacaoId);
  await prisma.aprovacao.updateMany({ where: { id, organizacaoId: s.organizacaoId }, data: dados(d) });
  revalidatePath(`/projetos/${d.projetoId}/arquitetura`);
}

export async function excluirAprovacao(formData: FormData) {
  const s = await exigirGestorDaOrg();
  const id = String(formData.get("id"));
  const projetoId = String(formData.get("projetoId"));
  await prisma.aprovacao.deleteMany({ where: { id, organizacaoId: s.organizacaoId } });
  revalidatePath(`/projetos/${projetoId}/arquitetura`);
}
