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

const schema = z.object({
  nome: z.string().min(1, "Informe o nome."),
  tipo: z.enum(["PF", "PJ"]).optional(),
  cpfCnpj: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().optional(),
  endereco: z.string().optional(),
  observacoes: z.string().optional(),
});

function ler(formData: FormData) {
  return schema.parse({
    nome: formData.get("nome"),
    tipo: formData.get("tipo") || undefined,
    cpfCnpj: (formData.get("cpfCnpj") as string) || undefined,
    telefone: (formData.get("telefone") as string) || undefined,
    email: (formData.get("email") as string) || undefined,
    endereco: (formData.get("endereco") as string) || undefined,
    observacoes: (formData.get("observacoes") as string) || undefined,
  });
}

export async function criarCliente(formData: FormData) {
  await exigirGestor();
  const d = ler(formData);
  await prisma.cliente.create({
    data: {
      nome: d.nome,
      tipo: d.tipo ?? "PF",
      cpfCnpj: d.cpfCnpj,
      telefone: d.telefone,
      email: d.email,
      endereco: d.endereco,
      observacoes: d.observacoes,
    },
  });
  revalidatePath("/clientes");
}

export async function atualizarCliente(formData: FormData) {
  await exigirGestor();
  const id = String(formData.get("id"));
  const d = ler(formData);
  await prisma.cliente.update({
    where: { id },
    data: {
      nome: d.nome,
      tipo: d.tipo ?? "PF",
      cpfCnpj: d.cpfCnpj,
      telefone: d.telefone,
      email: d.email,
      endereco: d.endereco,
      observacoes: d.observacoes,
    },
  });
  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
}

export async function excluirCliente(formData: FormData) {
  await exigirGestor();
  const id = String(formData.get("id"));
  const nProjetos = await prisma.projeto.count({ where: { clienteId: id } });
  if (nProjetos > 0) {
    throw new Error("Este cliente tem projetos vinculados. Exclua ou reatribua os projetos antes.");
  }
  await prisma.cliente.delete({ where: { id } });
  revalidatePath("/clientes");
  if (formData.get("redirecionar")) redirect("/clientes");
}
