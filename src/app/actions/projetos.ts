"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { podeEditar } from "@/lib/permissoes";

async function exigirGestor() {
  const session = await auth();
  if (!session?.user) throw new Error("Não autenticado.");
  if (!podeEditar(session.user.papel)) throw new Error("Sem permissão.");
}

// ---- Projeto ----
const projetoSchema = z.object({
  titulo: z.string().min(1, "Informe o título."),
  clienteId: z.string().min(1, "Selecione o cliente."),
  tipo: z.string().optional(),
  descricao: z.string().optional(),
  endereco: z.string().optional(),
  areaM2: z.coerce.number().optional(),
  valorContrato: z.coerce.number().optional(),
  status: z.enum(["PLANEJAMENTO", "EM_ANDAMENTO", "PAUSADA", "CONCLUIDA"]).optional(),
  dataInicioPrev: z.string().min(1, "Informe o início."),
  dataFimPrev: z.string().min(1, "Informe o término."),
  responsavelId: z.string().optional(),
});

function lerProjeto(formData: FormData) {
  const area = formData.get("areaM2");
  const valor = formData.get("valorContrato");
  return projetoSchema.parse({
    titulo: formData.get("titulo"),
    clienteId: formData.get("clienteId"),
    tipo: formData.get("tipo") || undefined,
    descricao: (formData.get("descricao") as string) || undefined,
    endereco: (formData.get("endereco") as string) || undefined,
    areaM2: area ? Number(area) : undefined,
    valorContrato: valor ? Number(valor) : undefined,
    status: formData.get("status") || undefined,
    dataInicioPrev: formData.get("dataInicioPrev"),
    dataFimPrev: formData.get("dataFimPrev"),
    responsavelId: (formData.get("responsavelId") as string) || undefined,
  });
}

function dadosProjeto(d: ReturnType<typeof lerProjeto>) {
  return {
    titulo: d.titulo,
    clienteId: d.clienteId,
    tipo: d.tipo ?? "Residencial",
    descricao: d.descricao,
    endereco: d.endereco,
    areaM2: d.areaM2 ?? null,
    valorContrato: d.valorContrato ?? null,
    status: d.status ?? "PLANEJAMENTO",
    dataInicioPrev: new Date(d.dataInicioPrev),
    dataFimPrev: new Date(d.dataFimPrev),
    responsavelId: d.responsavelId || null,
  };
}

export async function criarProjeto(formData: FormData) {
  await exigirGestor();
  const d = lerProjeto(formData);
  const p = await prisma.projeto.create({ data: dadosProjeto(d) });
  revalidatePath("/projetos");
  redirect(`/projetos/${p.id}`);
}

export async function atualizarProjeto(formData: FormData) {
  await exigirGestor();
  const id = String(formData.get("id"));
  const d = lerProjeto(formData);
  await prisma.projeto.update({ where: { id }, data: dadosProjeto(d) });
  revalidatePath("/projetos");
  revalidatePath(`/projetos/${id}`);
}

export async function excluirProjeto(formData: FormData) {
  await exigirGestor();
  const id = String(formData.get("id"));
  await prisma.projeto.delete({ where: { id } });
  revalidatePath("/projetos");
  redirect("/projetos");
}

// ---- Etapas ----
const etapaSchema = z.object({
  projetoId: z.string().min(1),
  nome: z.string().min(1, "Informe o nome da etapa."),
  inicioPrev: z.string().min(1),
  fimPrev: z.string().min(1),
  progresso: z.coerce.number().min(0).max(100).optional(),
  ordem: z.coerce.number().optional(),
});

function datasReais(progresso: number) {
  const hoje = new Date();
  return {
    inicioReal: progresso > 0 ? hoje : null,
    fimReal: progresso >= 100 ? hoje : null,
  };
}

export async function criarEtapa(formData: FormData) {
  await exigirGestor();
  const d = etapaSchema.parse({
    projetoId: formData.get("projetoId"),
    nome: formData.get("nome"),
    inicioPrev: formData.get("inicioPrev"),
    fimPrev: formData.get("fimPrev"),
    progresso: formData.get("progresso") ?? 0,
    ordem: formData.get("ordem") ?? 0,
  });
  const prog = d.progresso ?? 0;
  await prisma.etapaProjeto.create({
    data: {
      projetoId: d.projetoId,
      nome: d.nome,
      inicioPrev: new Date(d.inicioPrev),
      fimPrev: new Date(d.fimPrev),
      progresso: prog,
      ordem: d.ordem ?? 0,
      ...datasReais(prog),
    },
  });
  revalidatePath(`/projetos/${d.projetoId}`);
}

export async function atualizarEtapa(formData: FormData) {
  await exigirGestor();
  const id = String(formData.get("id"));
  const d = etapaSchema.parse({
    projetoId: formData.get("projetoId"),
    nome: formData.get("nome"),
    inicioPrev: formData.get("inicioPrev"),
    fimPrev: formData.get("fimPrev"),
    progresso: formData.get("progresso") ?? 0,
    ordem: formData.get("ordem") ?? 0,
  });
  const prog = d.progresso ?? 0;
  await prisma.etapaProjeto.update({
    where: { id },
    data: {
      nome: d.nome,
      inicioPrev: new Date(d.inicioPrev),
      fimPrev: new Date(d.fimPrev),
      progresso: prog,
      ordem: d.ordem ?? 0,
      ...datasReais(prog),
    },
  });
  revalidatePath(`/projetos/${d.projetoId}`);
}

export async function excluirEtapa(formData: FormData) {
  await exigirGestor();
  const id = String(formData.get("id"));
  const projetoId = String(formData.get("projetoId"));
  await prisma.etapaProjeto.delete({ where: { id } });
  revalidatePath(`/projetos/${projetoId}`);
}

// ---- Sub-etapas (checklist → progresso automático) ----
const subEtapaSchema = z.object({
  etapaId: z.string().min(1),
  titulo: z.string().min(1, "Informe o título."),
  descricao: z.string().optional(),
  status: z.enum(["PENDENTE", "EM_ANDAMENTO", "CONCLUIDA"]).optional(),
  ordem: z.coerce.number().optional(),
});

async function recalcularProgressoEtapa(etapaId: string) {
  const subs = await prisma.subEtapa.findMany({ where: { etapaId }, select: { status: true } });
  if (subs.length === 0) return;
  const feitas = subs.filter((s) => s.status === "CONCLUIDA").length;
  const progresso = Math.round((feitas / subs.length) * 100);
  await prisma.etapaProjeto.update({ where: { id: etapaId }, data: { progresso, ...datasReais(progresso) } });
}

export async function criarSubEtapa(formData: FormData) {
  await exigirGestor();
  const d = subEtapaSchema.parse({
    etapaId: formData.get("etapaId"),
    titulo: formData.get("titulo"),
    descricao: (formData.get("descricao") as string) || undefined,
    status: formData.get("status") || undefined,
    ordem: formData.get("ordem") ?? 0,
  });
  const projetoId = String(formData.get("projetoId"));
  const status = d.status ?? "PENDENTE";
  await prisma.subEtapa.create({
    data: {
      etapaId: d.etapaId,
      titulo: d.titulo,
      descricao: d.descricao,
      status,
      ordem: d.ordem ?? 0,
      concluidaEm: status === "CONCLUIDA" ? new Date() : null,
    },
  });
  await recalcularProgressoEtapa(d.etapaId);
  revalidatePath(`/projetos/${projetoId}`);
}

export async function atualizarSubEtapa(formData: FormData) {
  await exigirGestor();
  const id = String(formData.get("id"));
  const d = subEtapaSchema.parse({
    etapaId: formData.get("etapaId"),
    titulo: formData.get("titulo"),
    descricao: (formData.get("descricao") as string) || undefined,
    status: formData.get("status") || undefined,
    ordem: formData.get("ordem") ?? 0,
  });
  const projetoId = String(formData.get("projetoId"));
  const status = d.status ?? "PENDENTE";
  await prisma.subEtapa.update({
    where: { id },
    data: {
      titulo: d.titulo,
      descricao: d.descricao,
      status,
      ordem: d.ordem ?? 0,
      concluidaEm: status === "CONCLUIDA" ? new Date() : null,
    },
  });
  await recalcularProgressoEtapa(d.etapaId);
  revalidatePath(`/projetos/${projetoId}`);
}

export async function alternarSubEtapa(formData: FormData) {
  await exigirGestor();
  const id = String(formData.get("id"));
  const projetoId = String(formData.get("projetoId"));
  const sub = await prisma.subEtapa.findUnique({ where: { id } });
  if (!sub) return;
  const novo = sub.status === "CONCLUIDA" ? "PENDENTE" : "CONCLUIDA";
  await prisma.subEtapa.update({
    where: { id },
    data: { status: novo, concluidaEm: novo === "CONCLUIDA" ? new Date() : null },
  });
  await recalcularProgressoEtapa(sub.etapaId);
  revalidatePath(`/projetos/${projetoId}`);
}

export async function excluirSubEtapa(formData: FormData) {
  await exigirGestor();
  const id = String(formData.get("id"));
  const projetoId = String(formData.get("projetoId"));
  const sub = await prisma.subEtapa.findUnique({ where: { id } });
  await prisma.subEtapa.delete({ where: { id } });
  if (sub) await recalcularProgressoEtapa(sub.etapaId);
  revalidatePath(`/projetos/${projetoId}`);
}
