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

export async function excluirOrg(formData: FormData) {
  await exigirSuperAdmin();
  const id = String(formData.get("id"));
  // Cascade remove usuários, clientes, projetos (e o resto por cascade).
  await prisma.organizacao.delete({ where: { id } });
  revalidatePath("/admin");
}
