"use server";

import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { podeEditar } from "@/lib/permissoes";
import { sessaoOrg } from "@/lib/sessao";
import type { StatusItemRDO } from "@prisma/client";

// Apenas imagens; extensão derivada do tipo (evita servir arquivo malicioso de /uploads).
const TIPOS_FOTO: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/heic": ".heic",
};
const MAX_FOTO = 12 * 1024 * 1024; // 12 MB

async function salvarFoto(arquivo: File): Promise<string | null> {
  if (!arquivo || arquivo.size === 0) return null;
  const ext = TIPOS_FOTO[arquivo.type];
  if (!ext || arquivo.size > MAX_FOTO) return null;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const nome = `${randomUUID()}${ext}`;
  await writeFile(path.join(dir, nome), Buffer.from(await arquivo.arrayBuffer()));
  return `/uploads/${nome}`;
}

const STATUS_OK: StatusItemRDO[] = ["OK", "ATENCAO", "PROBLEMA"];

export async function criarRDO(formData: FormData) {
  const s = await sessaoOrg();
  const projetoId = String(formData.get("projetoId"));
  if (!projetoId) throw new Error("Projeto inválido.");
  const projeto = await prisma.projeto.findFirst({
    where: { id: projetoId, organizacaoId: s.organizacaoId },
    select: { id: true },
  });
  if (!projeto) throw new Error("Projeto não encontrado.");

  const dataStr = String(formData.get("data") || "");
  const data = dataStr ? new Date(dataStr) : new Date();

  const titulos = formData.getAll("itemTitulo").map(String);
  const statuses = formData.getAll("itemStatus").map(String);
  const itens = titulos
    .filter((t) => t.trim())
    .map((t, i) => ({
      titulo: t,
      status: (STATUS_OK.includes(statuses[i] as StatusItemRDO) ? statuses[i] : "OK") as StatusItemRDO,
      ordem: i,
    }));

  const arquivos = formData.getAll("foto").filter((f): f is File => f instanceof File && f.size > 0);
  const fotos: { url: string }[] = [];
  for (const f of arquivos) {
    const url = await salvarFoto(f);
    if (url) fotos.push({ url });
  }

  await prisma.diarioObra.create({
    data: {
      organizacaoId: s.organizacaoId,
      projetoId,
      data,
      clima: (formData.get("clima") as string) || null,
      maoDeObra: (formData.get("maoDeObra") as string) || null,
      atividades: (formData.get("atividades") as string) || null,
      ocorrencias: (formData.get("ocorrencias") as string) || null,
      criadoPorId: s.userId,
      itens: { create: itens },
      fotos: { create: fotos },
    },
  });

  revalidatePath(`/projetos/${projetoId}`);
}

export async function excluirRDO(formData: FormData) {
  const s = await sessaoOrg();
  const id = String(formData.get("id"));
  const projetoId = String(formData.get("projetoId"));
  const rdo = await prisma.diarioObra.findFirst({ where: { id, organizacaoId: s.organizacaoId } });
  if (!rdo) throw new Error("RDO não encontrado.");
  // Gestor/Admin apagam qualquer um; usuário comum só o próprio.
  if (!podeEditar(s.papel) && rdo.criadoPorId !== s.userId) {
    throw new Error("Sem permissão para excluir este RDO.");
  }
  await prisma.diarioObra.deleteMany({ where: { id, organizacaoId: s.organizacaoId } });
  revalidatePath(`/projetos/${projetoId}`);
  if (formData.get("redirecionar")) redirect(`/projetos/${projetoId}`);
}
