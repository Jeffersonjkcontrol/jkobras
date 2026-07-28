"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirGestorDaOrg, exigirGestorCom } from "@/lib/sessao";
import type { TipoCusto, StatusTarefa } from "@prisma/client";

const tipoCusto = z.enum(["DIARIA", "HORA", "EMPREITADA", "MENSALISTA"]);
const statusTarefa = z.enum(["PENDENTE", "EM_ANDAMENTO", "CONCLUIDA"]);

async function profissionalDaOrg(id: string, organizacaoId: string) {
  const p = await prisma.profissional.findFirst({ where: { id, organizacaoId }, select: { id: true } });
  if (!p) throw new Error("Profissional não encontrado.");
}

async function projetoDaOrg(projetoId: string, organizacaoId: string) {
  const p = await prisma.projeto.findFirst({ where: { id: projetoId, organizacaoId }, select: { id: true } });
  if (!p) throw new Error("Projeto não encontrado.");
}

// ---------------------------------------------------------------- Profissional
const profSchema = z.object({
  nome: z.string().min(1, "Informe o nome."),
  funcao: z.string().min(1, "Informe a função."),
  tipoCusto,
  custoValor: z.coerce.number().min(0).optional(),
  telefone: z.string().optional(),
  cpf: z.string().optional(),
  email: z.string().optional(),
  endereco: z.string().optional(),
  contatoEmergencia: z.string().optional(),
  chavePix: z.string().optional(),
  observacoes: z.string().optional(),
});

function lerProf(formData: FormData) {
  const custo = formData.get("custoValor");
  return profSchema.parse({
    nome: formData.get("nome"),
    funcao: formData.get("funcao"),
    tipoCusto: formData.get("tipoCusto"),
    custoValor: custo ? Number(custo) : undefined,
    telefone: (formData.get("telefone") as string) || undefined,
    cpf: (formData.get("cpf") as string) || undefined,
    email: (formData.get("email") as string) || undefined,
    endereco: (formData.get("endereco") as string) || undefined,
    contatoEmergencia: (formData.get("contatoEmergencia") as string) || undefined,
    chavePix: (formData.get("chavePix") as string) || undefined,
    observacoes: (formData.get("observacoes") as string) || undefined,
  });
}

function dadosProf(d: ReturnType<typeof lerProf>, ativo: boolean) {
  return {
    nome: d.nome,
    funcao: d.funcao,
    tipoCusto: d.tipoCusto as TipoCusto,
    custoValor: d.custoValor ?? null,
    telefone: d.telefone ?? null,
    cpf: d.cpf ?? null,
    email: d.email ?? null,
    endereco: d.endereco ?? null,
    contatoEmergencia: d.contatoEmergencia ?? null,
    chavePix: d.chavePix ?? null,
    observacoes: d.observacoes ?? null,
    ativo,
  };
}

export async function criarProfissional(formData: FormData) {
  const s = await exigirGestorCom("custosEquipe");
  const d = lerProf(formData);
  await prisma.profissional.create({ data: { ...dadosProf(d, true), organizacaoId: s.organizacaoId } });
  revalidatePath("/equipe");
}

export async function atualizarProfissional(formData: FormData) {
  const s = await exigirGestorCom("custosEquipe");
  const id = String(formData.get("id"));
  const d = lerProf(formData);
  const ativo = formData.get("ativo") != null;
  await prisma.profissional.updateMany({ where: { id, organizacaoId: s.organizacaoId }, data: dadosProf(d, ativo) });
  revalidatePath("/equipe");
  revalidatePath(`/equipe/${id}`);
}

export async function excluirProfissional(formData: FormData) {
  const s = await exigirGestorCom("custosEquipe");
  const id = String(formData.get("id"));
  await prisma.profissional.deleteMany({ where: { id, organizacaoId: s.organizacaoId } });
  revalidatePath("/equipe");
  redirect("/equipe");
}

// ------------------------------------------------------------------- Alocação
const alocacaoSchema = z.object({
  projetoId: z.string().min(1),
  profissionalId: z.string().min(1),
  funcaoNaObra: z.string().optional(),
  tipoCusto,
  custoValor: z.coerce.number().min(0).optional(),
  observacoes: z.string().optional(),
});

function lerAlocacao(formData: FormData) {
  const custo = formData.get("custoValor");
  return alocacaoSchema.parse({
    projetoId: formData.get("projetoId"),
    profissionalId: formData.get("profissionalId"),
    funcaoNaObra: (formData.get("funcaoNaObra") as string) || undefined,
    tipoCusto: formData.get("tipoCusto"),
    custoValor: custo ? Number(custo) : undefined,
    observacoes: (formData.get("observacoes") as string) || undefined,
  });
}

export async function alocarProfissional(formData: FormData) {
  const s = await exigirGestorCom("custosEquipe");
  const d = lerAlocacao(formData);
  await projetoDaOrg(d.projetoId, s.organizacaoId);
  await profissionalDaOrg(d.profissionalId, s.organizacaoId);
  const existe = await prisma.alocacaoProjeto.findFirst({
    where: { projetoId: d.projetoId, profissionalId: d.profissionalId },
    select: { id: true },
  });
  if (existe) throw new Error("Este profissional já está alocado nesta obra.");
  await prisma.alocacaoProjeto.create({
    data: {
      organizacaoId: s.organizacaoId,
      projetoId: d.projetoId,
      profissionalId: d.profissionalId,
      funcaoNaObra: d.funcaoNaObra ?? null,
      tipoCusto: d.tipoCusto as TipoCusto,
      custoValor: d.custoValor ?? null,
      observacoes: d.observacoes ?? null,
    },
  });
  revalidatePath(`/projetos/${d.projetoId}/equipe`);
}

export async function atualizarAlocacao(formData: FormData) {
  const s = await exigirGestorCom("custosEquipe");
  const id = String(formData.get("id"));
  const d = lerAlocacao(formData);
  await prisma.alocacaoProjeto.updateMany({
    where: { id, organizacaoId: s.organizacaoId },
    data: {
      funcaoNaObra: d.funcaoNaObra ?? null,
      tipoCusto: d.tipoCusto as TipoCusto,
      custoValor: d.custoValor ?? null,
      observacoes: d.observacoes ?? null,
    },
  });
  revalidatePath(`/projetos/${d.projetoId}/equipe`);
}

export async function desalocarProfissional(formData: FormData) {
  const s = await exigirGestorCom("custosEquipe");
  const id = String(formData.get("id"));
  const projetoId = String(formData.get("projetoId"));
  await prisma.alocacaoProjeto.deleteMany({ where: { id, organizacaoId: s.organizacaoId } });
  revalidatePath(`/projetos/${projetoId}/equipe`);
}

// --------------------------------------------------------------------- Tarefa
const tarefaSchema = z.object({
  projetoId: z.string().min(1),
  titulo: z.string().min(1, "Informe o título."),
  descricao: z.string().optional(),
  profissionalId: z.string().optional(),
  status: statusTarefa,
  prazo: z.string().optional(),
  custo: z.coerce.number().min(0).optional(),
});

function lerTarefa(formData: FormData) {
  const custo = formData.get("custo");
  return tarefaSchema.parse({
    projetoId: formData.get("projetoId"),
    titulo: formData.get("titulo"),
    descricao: (formData.get("descricao") as string) || undefined,
    profissionalId: (formData.get("profissionalId") as string) || undefined,
    status: formData.get("status") || "PENDENTE",
    prazo: (formData.get("prazo") as string) || undefined,
    custo: custo ? Number(custo) : undefined,
  });
}

function dadosTarefa(d: ReturnType<typeof lerTarefa>, podeCusto: boolean) {
  const status = d.status as StatusTarefa;
  return {
    titulo: d.titulo,
    descricao: d.descricao ?? null,
    profissionalId: d.profissionalId || null,
    status,
    prazo: d.prazo ? new Date(d.prazo) : null,
    // O custo da tarefa só é gravado por quem pode ver custos da equipe.
    custo: podeCusto ? d.custo ?? null : null,
    concluidaEm: status === "CONCLUIDA" ? new Date() : null,
  };
}

export async function criarTarefa(formData: FormData) {
  const s = await exigirGestorDaOrg();
  const d = lerTarefa(formData);
  await projetoDaOrg(d.projetoId, s.organizacaoId);
  if (d.profissionalId) await profissionalDaOrg(d.profissionalId, s.organizacaoId);
  await prisma.tarefaProfissional.create({
    data: { ...dadosTarefa(d, s.perm.custosEquipe), organizacaoId: s.organizacaoId, projetoId: d.projetoId },
  });
  revalidatePath(`/projetos/${d.projetoId}/equipe`);
}

export async function atualizarTarefa(formData: FormData) {
  const s = await exigirGestorDaOrg();
  const id = String(formData.get("id"));
  const d = lerTarefa(formData);
  if (d.profissionalId) await profissionalDaOrg(d.profissionalId, s.organizacaoId);
  await prisma.tarefaProfissional.updateMany({ where: { id, organizacaoId: s.organizacaoId }, data: dadosTarefa(d, s.perm.custosEquipe) });
  revalidatePath(`/projetos/${d.projetoId}/equipe`);
}

export async function alternarTarefa(formData: FormData) {
  const s = await exigirGestorDaOrg();
  const id = String(formData.get("id"));
  const projetoId = String(formData.get("projetoId"));
  const t = await prisma.tarefaProfissional.findFirst({ where: { id, organizacaoId: s.organizacaoId }, select: { status: true } });
  if (!t) return;
  const novo = t.status === "CONCLUIDA" ? "PENDENTE" : "CONCLUIDA";
  await prisma.tarefaProfissional.updateMany({
    where: { id, organizacaoId: s.organizacaoId },
    data: { status: novo, concluidaEm: novo === "CONCLUIDA" ? new Date() : null },
  });
  revalidatePath(`/projetos/${projetoId}/equipe`);
}

export async function excluirTarefa(formData: FormData) {
  const s = await exigirGestorDaOrg();
  const id = String(formData.get("id"));
  const projetoId = String(formData.get("projetoId"));
  await prisma.tarefaProfissional.deleteMany({ where: { id, organizacaoId: s.organizacaoId } });
  revalidatePath(`/projetos/${projetoId}/equipe`);
}

// -------------------------------------------------- Integração com o Financeiro
const despesaSchema = z.object({
  projetoId: z.string().min(1),
  descricao: z.string().min(1),
  valor: z.coerce.number().min(0),
});

/** Gera um lançamento de DESPESA (categoria "Mão de obra") a partir do custo da equipe. */
export async function gerarDespesaMaoDeObra(formData: FormData) {
  const s = await exigirGestorCom("financeiro");
  const d = despesaSchema.parse({
    projetoId: formData.get("projetoId"),
    descricao: formData.get("descricao"),
    valor: formData.get("valor"),
  });
  await projetoDaOrg(d.projetoId, s.organizacaoId);
  await prisma.lancamentoFinanceiro.create({
    data: {
      organizacaoId: s.organizacaoId,
      projetoId: d.projetoId,
      descricao: d.descricao,
      tipo: "DESPESA",
      status: "REALIZADO",
      categoria: "Mão de obra",
      valor: d.valor,
      data: new Date(),
    },
  });
  revalidatePath(`/projetos/${d.projetoId}/financeiro`);
  revalidatePath(`/projetos/${d.projetoId}/equipe`);
}
