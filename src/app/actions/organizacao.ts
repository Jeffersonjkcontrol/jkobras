"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirAdminDaOrg } from "@/lib/sessao";

const MAX_LOGO = 400 * 1024;
const TIPOS_LOGO = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

function revalidar() {
  revalidatePath("/configuracoes");
  revalidatePath("/", "layout");
}

export async function salvarNomeOrg(formData: FormData) {
  const s = await exigirAdminDaOrg();
  const nome = z.string().min(1, "Informe o nome.").parse(formData.get("nome"));
  await prisma.organizacao.update({ where: { id: s.organizacaoId }, data: { nome } });
  revalidar();
}

export async function salvarLogoOrg(formData: FormData) {
  const s = await exigirAdminDaOrg();
  const file = formData.get("logo") as File | null;
  if (!file || file.size === 0) throw new Error("Selecione uma imagem.");
  if (!TIPOS_LOGO.includes(file.type)) throw new Error("Formato inválido. Use PNG, JPG, WEBP ou SVG.");
  if (file.size > MAX_LOGO) throw new Error("Imagem muito grande (máx. 400 KB).");
  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;
  await prisma.organizacao.update({ where: { id: s.organizacaoId }, data: { logoData: dataUrl } });
  revalidar();
}

export async function removerLogoOrg() {
  const s = await exigirAdminDaOrg();
  await prisma.organizacao.update({ where: { id: s.organizacaoId }, data: { logoData: null } });
  revalidar();
}
