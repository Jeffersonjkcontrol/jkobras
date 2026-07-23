// Helpers do módulo Documentos / Plantas.

export const CATEGORIA_DOCUMENTO_LABEL: Record<string, string> = {
  PLANTA: "Planta / Projeto",
  CONTRATO: "Contrato",
  LICENCA: "Licença / Alvará",
  ORCAMENTO: "Orçamento",
  FOTO: "Foto",
  OUTRO: "Outro",
};

export const CATEGORIAS_DOCUMENTO = ["PLANTA", "CONTRATO", "LICENCA", "ORCAMENTO", "FOTO", "OUTRO"] as const;

// Extensões aceitas (validadas pelo nome do arquivo; MIME de CAD é pouco confiável).
export const EXTENSOES_PERMITIDAS = ["pdf", "png", "jpg", "jpeg", "webp", "dwg", "dxf"] as const;

export const MAX_DOC_BYTES = 25 * 1024 * 1024; // 25 MB

export function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Extensão minúscula do nome do arquivo (sem o ponto), ou "" se não houver. */
export function extensaoDe(nomeArquivo: string): string {
  const i = nomeArquivo.lastIndexOf(".");
  return i >= 0 ? nomeArquivo.slice(i + 1).toLowerCase() : "";
}
