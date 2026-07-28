"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirGestorDaOrg } from "@/lib/sessao";
import { gerarToken } from "@/lib/portal";

/** Garante que o projeto é da organização da sessão. */
async function projetoDaOrg(projetoId: string, organizacaoId: string) {
  const p = await prisma.projeto.findFirst({ where: { id: projetoId, organizacaoId }, select: { id: true } });
  if (!p) throw new Error("Projeto não encontrado.");
}

function lerFlags(formData: FormData) {
  return {
    mostrarCronograma: formData.get("mostrarCronograma") === "on",
    mostrarDiario: formData.get("mostrarDiario") === "on",
    mostrarDocumentos: formData.get("mostrarDocumentos") === "on",
    mostrarAprovacoes: formData.get("mostrarAprovacoes") === "on",
  };
}

/** Cria o link do portal (ou reativa o existente, mantendo o mesmo endereço). */
export async function gerarLinkPortal(formData: FormData) {
  const s = await exigirGestorDaOrg();
  const projetoId = String(formData.get("projetoId"));
  await projetoDaOrg(projetoId, s.organizacaoId);

  await prisma.portalCliente.upsert({
    where: { projetoId },
    update: { ativo: true },
    create: {
      token: gerarToken(),
      projetoId,
      organizacaoId: s.organizacaoId,
    },
  });
  revalidatePath(`/projetos/${projetoId}`);
}

/** Desativa o link — quem tiver a URL deixa de ver o conteúdo. */
export async function revogarLinkPortal(formData: FormData) {
  const s = await exigirGestorDaOrg();
  const projetoId = String(formData.get("projetoId"));
  await prisma.portalCliente.updateMany({
    where: { projetoId, organizacaoId: s.organizacaoId },
    data: { ativo: false },
  });
  revalidatePath(`/projetos/${projetoId}`);
}

/** Gera um endereço novo e invalida o anterior (útil se o link vazou). */
export async function regenerarTokenPortal(formData: FormData) {
  const s = await exigirGestorDaOrg();
  const projetoId = String(formData.get("projetoId"));
  await prisma.portalCliente.updateMany({
    where: { projetoId, organizacaoId: s.organizacaoId },
    data: { token: gerarToken(), ativo: true, visitas: 0, ultimoAcessoEm: null },
  });
  revalidatePath(`/projetos/${projetoId}`);
}

/** Salva o que o cliente pode ver e a validade do link. */
export async function salvarOpcoesPortal(formData: FormData) {
  const s = await exigirGestorDaOrg();
  const projetoId = String(formData.get("projetoId"));
  const validade = String(formData.get("expiraEm") || "").trim();

  let expiraEm: Date | null = null;
  if (validade) {
    const d = new Date(validade);
    if (Number.isNaN(d.getTime())) throw new Error("Data de validade inválida.");
    d.setHours(23, 59, 59, 999); // vale o dia inteiro
    expiraEm = d;
  }

  await prisma.portalCliente.updateMany({
    where: { projetoId, organizacaoId: s.organizacaoId },
    data: { ...lerFlags(formData), expiraEm },
  });
  revalidatePath(`/projetos/${projetoId}`);
}

/** Liga/desliga o sigilo do documento DENTRO do escritório (quem vê restritos). */
export async function alternarRestricaoDocumento(formData: FormData) {
  const s = await exigirGestorDaOrg();
  const id = String(formData.get("id"));
  const projetoId = String(formData.get("projetoId"));

  const doc = await prisma.documento.findFirst({
    where: { id, organizacaoId: s.organizacaoId },
    select: { restrito: true },
  });
  if (!doc) throw new Error("Documento não encontrado.");

  await prisma.documento.updateMany({
    where: { id, organizacaoId: s.organizacaoId },
    data: { restrito: !doc.restrito },
  });
  revalidatePath(`/projetos/${projetoId}/documentos`);
}

/** Liga/desliga a visibilidade de UM documento no portal do cliente. */
export async function alternarVisibilidadeDocumento(formData: FormData) {
  const s = await exigirGestorDaOrg();
  const id = String(formData.get("id"));
  const projetoId = String(formData.get("projetoId"));

  const doc = await prisma.documento.findFirst({
    where: { id, organizacaoId: s.organizacaoId },
    select: { visivelCliente: true },
  });
  if (!doc) throw new Error("Documento não encontrado.");

  await prisma.documento.updateMany({
    where: { id, organizacaoId: s.organizacaoId },
    data: { visivelCliente: !doc.visivelCliente },
  });
  revalidatePath(`/projetos/${projetoId}/documentos`);
}
