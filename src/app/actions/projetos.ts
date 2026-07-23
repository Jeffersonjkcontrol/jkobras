"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirGestorDaOrg } from "@/lib/sessao";

/** Garante que o projeto pertence à organização (retorna o organizacaoId). */
async function projetoDaOrg(projetoId: string, organizacaoId: string): Promise<string> {
  const p = await prisma.projeto.findFirst({ where: { id: projetoId, organizacaoId }, select: { id: true } });
  if (!p) throw new Error("Projeto não encontrado.");
  return organizacaoId;
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

function dadosBase(d: ReturnType<typeof lerProjeto>) {
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

/** Confere que o cliente escolhido é da mesma organização (evita vincular a cliente de outro tenant). */
async function clienteDaOrg(clienteId: string, organizacaoId: string) {
  const c = await prisma.cliente.findFirst({ where: { id: clienteId, organizacaoId }, select: { id: true } });
  if (!c) throw new Error("Cliente inválido.");
}

export async function criarProjeto(formData: FormData) {
  const s = await exigirGestorDaOrg();
  const d = lerProjeto(formData);
  await clienteDaOrg(d.clienteId, s.organizacaoId);
  const p = await prisma.projeto.create({ data: { ...dadosBase(d), organizacaoId: s.organizacaoId } });
  revalidatePath("/projetos");
  redirect(`/projetos/${p.id}`);
}

export async function atualizarProjeto(formData: FormData) {
  const s = await exigirGestorDaOrg();
  const id = String(formData.get("id"));
  const d = lerProjeto(formData);
  await clienteDaOrg(d.clienteId, s.organizacaoId);
  await prisma.projeto.updateMany({ where: { id, organizacaoId: s.organizacaoId }, data: dadosBase(d) });
  revalidatePath("/projetos");
  revalidatePath(`/projetos/${id}`);
}

export async function excluirProjeto(formData: FormData) {
  const s = await exigirGestorDaOrg();
  const id = String(formData.get("id"));
  await prisma.projeto.deleteMany({ where: { id, organizacaoId: s.organizacaoId } });
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

function lerEtapa(formData: FormData) {
  return etapaSchema.parse({
    projetoId: formData.get("projetoId"),
    nome: formData.get("nome"),
    inicioPrev: formData.get("inicioPrev"),
    fimPrev: formData.get("fimPrev"),
    progresso: formData.get("progresso") ?? 0,
    ordem: formData.get("ordem") ?? 0,
  });
}

function datasReais(progresso: number) {
  const hoje = new Date();
  return { inicioReal: progresso > 0 ? hoje : null, fimReal: progresso >= 100 ? hoje : null };
}

export async function criarEtapa(formData: FormData) {
  const s = await exigirGestorDaOrg();
  const d = lerEtapa(formData);
  await projetoDaOrg(d.projetoId, s.organizacaoId);
  const prog = d.progresso ?? 0;
  await prisma.etapaProjeto.create({
    data: {
      organizacaoId: s.organizacaoId,
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
  const s = await exigirGestorDaOrg();
  const id = String(formData.get("id"));
  const d = lerEtapa(formData);
  const prog = d.progresso ?? 0;
  await prisma.etapaProjeto.updateMany({
    where: { id, organizacaoId: s.organizacaoId },
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
  const s = await exigirGestorDaOrg();
  const id = String(formData.get("id"));
  const projetoId = String(formData.get("projetoId"));
  await prisma.etapaProjeto.deleteMany({ where: { id, organizacaoId: s.organizacaoId } });
  revalidatePath(`/projetos/${projetoId}`);
}

// ---- Sub-etapas (checklist → progresso automático) ----
const subEtapaSchema = z.object({
  etapaId: z.string().min(1),
  titulo: z.string().min(1, "Informe o título."),
  descricao: z.string().optional(),
  status: z.enum(["PENDENTE", "EM_ANDAMENTO", "CONCLUIDA"]).optional(),
  ordem: z.coerce.number().optional(),
  responsavelProfId: z.string().optional(),
});

function lerSubEtapa(formData: FormData) {
  return subEtapaSchema.parse({
    etapaId: formData.get("etapaId"),
    titulo: formData.get("titulo"),
    descricao: (formData.get("descricao") as string) || undefined,
    status: formData.get("status") || undefined,
    ordem: formData.get("ordem") ?? 0,
    responsavelProfId: (formData.get("responsavelProfId") as string) || undefined,
  });
}

/** Confere que o profissional (responsável) é da mesma organização. */
async function profissionalOpcionalDaOrg(profId: string | undefined, organizacaoId: string) {
  if (!profId) return;
  const p = await prisma.profissional.findFirst({ where: { id: profId, organizacaoId }, select: { id: true } });
  if (!p) throw new Error("Profissional inválido.");
}

async function recalcularProgressoEtapa(etapaId: string, organizacaoId: string) {
  const subs = await prisma.subEtapa.findMany({ where: { etapaId, organizacaoId }, select: { status: true } });
  if (subs.length === 0) return;
  const feitas = subs.filter((s) => s.status === "CONCLUIDA").length;
  const progresso = Math.round((feitas / subs.length) * 100);
  await prisma.etapaProjeto.updateMany({ where: { id: etapaId, organizacaoId }, data: { progresso, ...datasReais(progresso) } });
}

export async function criarSubEtapa(formData: FormData) {
  const s = await exigirGestorDaOrg();
  const d = lerSubEtapa(formData);
  const projetoId = String(formData.get("projetoId"));
  // etapa precisa ser da org
  const etapa = await prisma.etapaProjeto.findFirst({ where: { id: d.etapaId, organizacaoId: s.organizacaoId }, select: { id: true } });
  if (!etapa) throw new Error("Etapa inválida.");
  await profissionalOpcionalDaOrg(d.responsavelProfId, s.organizacaoId);
  const status = d.status ?? "PENDENTE";
  await prisma.subEtapa.create({
    data: {
      organizacaoId: s.organizacaoId,
      etapaId: d.etapaId,
      titulo: d.titulo,
      descricao: d.descricao,
      status,
      ordem: d.ordem ?? 0,
      responsavelProfId: d.responsavelProfId || null,
      concluidaEm: status === "CONCLUIDA" ? new Date() : null,
    },
  });
  await recalcularProgressoEtapa(d.etapaId, s.organizacaoId);
  revalidatePath(`/projetos/${projetoId}`);
}

export async function atualizarSubEtapa(formData: FormData) {
  const s = await exigirGestorDaOrg();
  const id = String(formData.get("id"));
  const d = lerSubEtapa(formData);
  const projetoId = String(formData.get("projetoId"));
  await profissionalOpcionalDaOrg(d.responsavelProfId, s.organizacaoId);
  const status = d.status ?? "PENDENTE";
  await prisma.subEtapa.updateMany({
    where: { id, organizacaoId: s.organizacaoId },
    data: {
      titulo: d.titulo,
      descricao: d.descricao,
      status,
      ordem: d.ordem ?? 0,
      responsavelProfId: d.responsavelProfId || null,
      concluidaEm: status === "CONCLUIDA" ? new Date() : null,
    },
  });
  await recalcularProgressoEtapa(d.etapaId, s.organizacaoId);
  revalidatePath(`/projetos/${projetoId}`);
}

export async function alternarSubEtapa(formData: FormData) {
  const s = await exigirGestorDaOrg();
  const id = String(formData.get("id"));
  const projetoId = String(formData.get("projetoId"));
  const sub = await prisma.subEtapa.findFirst({ where: { id, organizacaoId: s.organizacaoId } });
  if (!sub) return;
  const novo = sub.status === "CONCLUIDA" ? "PENDENTE" : "CONCLUIDA";
  await prisma.subEtapa.updateMany({
    where: { id, organizacaoId: s.organizacaoId },
    data: { status: novo, concluidaEm: novo === "CONCLUIDA" ? new Date() : null },
  });
  await recalcularProgressoEtapa(sub.etapaId, s.organizacaoId);
  revalidatePath(`/projetos/${projetoId}`);
}

export async function excluirSubEtapa(formData: FormData) {
  const s = await exigirGestorDaOrg();
  const id = String(formData.get("id"));
  const projetoId = String(formData.get("projetoId"));
  const sub = await prisma.subEtapa.findFirst({ where: { id, organizacaoId: s.organizacaoId } });
  await prisma.subEtapa.deleteMany({ where: { id, organizacaoId: s.organizacaoId } });
  if (sub) await recalcularProgressoEtapa(sub.etapaId, s.organizacaoId);
  revalidatePath(`/projetos/${projetoId}`);
}
