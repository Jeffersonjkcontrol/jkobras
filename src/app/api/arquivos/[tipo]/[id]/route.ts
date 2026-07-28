// Servidor de arquivos com controle de acesso.
//
// Os uploads NÃO ficam mais em public/ (onde eram servidos a qualquer um que
// soubesse a URL, inclusive de outro escritório). Agora ficam em dados/uploads e
// só saem por aqui, mediante uma de duas autorizações:
//   1) sessão de um usuário da MESMA organização dona do arquivo; ou
//   2) ?t=<token> de um portal de cliente ativo, do MESMO projeto
//      (e, para documentos, apenas os marcados como visíveis ao cliente).
// Qualquer outra situação responde 404 — nunca 403, para não confirmar que o
// arquivo existe.
import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { portalPorToken } from "@/lib/portal";

export const dynamic = "force-dynamic";

const naoEncontrado = () => new NextResponse("Não encontrado", { status: 404 });

/** Extrai o nome do arquivo da url salva (/uploads/xxx.ext), barrando path traversal. */
function nomeArquivoSeguro(url: string): string | null {
  const base = path.basename(url);
  if (!base || base !== url.replace(/^\/uploads\//, "")) return null;
  if (base.includes("..") || base.includes("/") || base.includes("\\")) return null;
  return base;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ tipo: string; id: string }> }
) {
  const { tipo, id } = await params;
  if (tipo !== "documento" && tipo !== "foto") return naoEncontrado();

  // 1) Carrega o arquivo pedido junto do que é preciso para autorizar.
  let url: string;
  let mimeType: string;
  let organizacaoId: string;
  let projetoId: string;
  let exigeLiberacao = false; // documentos precisam de visivelCliente no portal

  if (tipo === "documento") {
    const doc = await prisma.documento.findUnique({
      where: { id },
      select: { url: true, mimeType: true, organizacaoId: true, projetoId: true, visivelCliente: true },
    });
    if (!doc) return naoEncontrado();
    url = doc.url;
    mimeType = doc.mimeType;
    organizacaoId = doc.organizacaoId;
    projetoId = doc.projetoId;
    exigeLiberacao = !doc.visivelCliente;
  } else {
    // FotoRDO não tem organizacaoId próprio: o escopo vem do diário pai.
    const foto = await prisma.fotoRDO.findUnique({
      where: { id },
      select: { url: true, diario: { select: { organizacaoId: true, projetoId: true } } },
    });
    if (!foto?.diario) return naoEncontrado();
    url = foto.url;
    mimeType = "image/jpeg"; // fallback; corrigido pela extensão abaixo
    organizacaoId = foto.diario.organizacaoId;
    projetoId = foto.diario.projetoId;
  }

  // 2) Autorização
  let autorizado = false;

  const token = new URL(req.url).searchParams.get("t");
  if (token) {
    const r = await portalPorToken(token);
    if (r.ok && r.portal.projetoId === projetoId && r.portal.organizacaoId === organizacaoId) {
      if (tipo === "foto") autorizado = r.portal.mostrarDiario;
      else autorizado = r.portal.mostrarDocumentos && !exigeLiberacao;
    }
  }

  if (!autorizado) {
    const session = await auth();
    const u = session?.user;
    if (u) {
      const orgDaSessao = u.impersonandoOrgId ?? u.organizacaoId;
      // Super-admin sem impersonar não tem motivo para baixar arquivo de tenant.
      autorizado = !!orgDaSessao && orgDaSessao === organizacaoId;
    }
  }

  if (!autorizado) return naoEncontrado();

  // 3) Entrega o arquivo
  const nome = nomeArquivoSeguro(url);
  if (!nome) return naoEncontrado();

  try {
    const conteudo = await readFile(path.join(process.cwd(), "dados", "uploads", nome));
    const ext = path.extname(nome).toLowerCase();
    const porExtensao: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".heic": "image/heic",
      ".pdf": "application/pdf",
      ".dwg": "application/acad",
      ".dxf": "image/vnd.dxf",
    };
    const contentType = porExtensao[ext] ?? mimeType ?? "application/octet-stream";

    return new NextResponse(new Uint8Array(conteudo), {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(conteudo.length),
        // Conteúdo privado: nunca em cache compartilhado.
        "Cache-Control": "private, max-age=300",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return naoEncontrado();
  }
}
