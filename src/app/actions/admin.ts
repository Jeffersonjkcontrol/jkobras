"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { ehSuperAdmin } from "@/lib/permissoes";

async function exigirSuperAdmin() {
  const session = await auth();
  if (!session?.user || !ehSuperAdmin(session.user.papel)) throw new Error("Sem permissão.");
}

export async function alternarOrgAtiva(formData: FormData) {
  await exigirSuperAdmin();
  const id = String(formData.get("id"));
  const org = await prisma.organizacao.findUnique({ where: { id }, select: { ativa: true } });
  if (!org) return;
  await prisma.organizacao.update({ where: { id }, data: { ativa: !org.ativa } });
  revalidatePath("/admin");
}

/** Define o fim do período de teste. Aceita uma data ("2026-08-15") ou
 *  um número de dias a partir de hoje ("15"). O prazo vale até o FIM do dia. */
export async function definirTrial(formData: FormData) {
  await exigirSuperAdmin();
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
  fim.setHours(23, 59, 59, 999); // vale o dia inteiro

  // Reativa a conta ao (re)abrir um teste — senão o acesso seguiria bloqueado.
  await prisma.organizacao.update({ where: { id }, data: { trialAte: fim, ativa: true } });
  revalidatePath("/admin");
}

/** Remove o prazo: a conta passa a ser permanente. */
export async function tornarPermanente(formData: FormData) {
  await exigirSuperAdmin();
  const id = String(formData.get("id"));
  await prisma.organizacao.update({ where: { id }, data: { trialAte: null, ativa: true } });
  revalidatePath("/admin");
}

export async function excluirOrg(formData: FormData) {
  await exigirSuperAdmin();
  const id = String(formData.get("id"));
  // Cascade remove usuários, clientes, projetos (e o resto por cascade).
  await prisma.organizacao.delete({ where: { id } });
  revalidatePath("/admin");
}
