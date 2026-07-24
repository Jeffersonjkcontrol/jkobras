"use server";

import { randomUUID } from "crypto";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirGestorDaOrg } from "@/lib/sessao";
import { EXTENSOES_PERMITIDAS, MAX_DOC_BYTES, extensaoDe } from "@/lib/documentos";
import type { CategoriaDocumento, Disciplina } from "@prisma/client";

const CATEGORIAS_OK: CategoriaDocumento[] = ["PLANTA", "CONTRATO", "LICENCA", "ORCAMENTO", "FOTO", "OUTRO"];
const DISCIPLINAS_OK: Disciplina[] = [
  "ARQUITETONICO",
  "ESTRUTURAL",
  "ELETRICO",
  "HIDRAULICO",
  "CLIMATIZACAO",
  "INCENDIO",
  "PAISAGISMO",
  "INTERIORES",
  "OUTRO",
];

export async function criarDocumento(formData: FormData) {
  const s = await exigirGestorDaOrg();
  const projetoId = String(formData.get("projetoId"));
  const projeto = await prisma.projeto.findFirst({ where: { id: projetoId, organizacaoId: s.organizacaoId }, select: { id: true } });
  if (!projeto) throw new Error("Projeto não encontrado.");

  const arquivo = formData.get("arquivo");
  if (!(arquivo instanceof File) || arquivo.size === 0) throw new Error("Selecione um arquivo.");
  if (arquivo.size > MAX_DOC_BYTES) throw new Error("Arquivo acima de 25 MB.");

  const ext = extensaoDe(arquivo.name);
  if (!EXTENSOES_PERMITIDAS.includes(ext as (typeof EXTENSOES_PERMITIDAS)[number])) {
    throw new Error("Tipo de arquivo não permitido. Use PDF, imagem, DWG ou DXF.");
  }

  const categoriaRaw = String(formData.get("categoria") || "OUTRO") as CategoriaDocumento;
  const categoria = CATEGORIAS_OK.includes(categoriaRaw) ? categoriaRaw : "OUTRO";
  const nomeInformado = String(formData.get("nome") || "").trim();
  const nome = nomeInformado || arquivo.name;

  // Controle de revisão (plantas): prancha agrupa as revisões do mesmo desenho.
  const disciplinaRaw = String(formData.get("disciplina") || "OUTRO") as Disciplina;
  const disciplina = DISCIPLINAS_OK.includes(disciplinaRaw) ? disciplinaRaw : "OUTRO";
  const prancha = String(formData.get("prancha") || "").trim() || null;
  const revisao = prancha ? String(formData.get("revisao") || "").trim() || "R00" : null;

  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const nomeArquivo = `${randomUUID()}.${ext}`;
  await writeFile(path.join(dir, nomeArquivo), Buffer.from(await arquivo.arrayBuffer()));

  await prisma.documento.create({
    data: {
      organizacaoId: s.organizacaoId,
      projetoId,
      nome,
      categoria,
      disciplina,
      prancha,
      revisao,
      url: `/uploads/${nomeArquivo}`,
      mimeType: arquivo.type || `application/${ext}`,
      tamanho: arquivo.size,
      enviadoPorId: s.userId,
    },
  });

  revalidatePath(`/projetos/${projetoId}/documentos`);
}

export async function excluirDocumento(formData: FormData) {
  const s = await exigirGestorDaOrg();
  const id = String(formData.get("id"));
  const projetoId = String(formData.get("projetoId"));
  const doc = await prisma.documento.findFirst({ where: { id, organizacaoId: s.organizacaoId }, select: { url: true } });
  if (!doc) throw new Error("Documento não encontrado.");

  await prisma.documento.deleteMany({ where: { id, organizacaoId: s.organizacaoId } });

  // Remove o arquivo do disco (best-effort).
  try {
    const nome = doc.url.replace(/^\/uploads\//, "");
    if (nome && !nome.includes("/") && !nome.includes("..")) {
      await unlink(path.join(process.cwd(), "public", "uploads", nome));
    }
  } catch {
    // arquivo já ausente — ignorar
  }

  revalidatePath(`/projetos/${projetoId}/documentos`);
}
