// URLs dos arquivos protegidos. Os uploads não são mais servidos estaticamente:
// tudo passa por /api/arquivos, que verifica sessão ou token do portal do cliente.
// Passe `token` apenas nas páginas públicas do portal.

export function urlDocumento(id: string, token?: string): string {
  return `/api/arquivos/documento/${id}${token ? `?t=${encodeURIComponent(token)}` : ""}`;
}

export function urlFoto(id: string, token?: string): string {
  return `/api/arquivos/foto/${id}${token ? `?t=${encodeURIComponent(token)}` : ""}`;
}
