import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { HardHat, CalendarRange, MapPin, Camera, CloudSun, FileText, Stamp, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { portalPorToken, registrarVisita, type MotivoBloqueio } from "@/lib/portal";
import { urlDocumento, urlFoto } from "@/lib/arquivos";
import { formatarData } from "@/lib/utils";
import { statusCalculadoProjeto, statusCalculadoEtapa, STATUS_LABEL } from "@/lib/projetos";
import { CATEGORIA_DOCUMENTO_LABEL, formatarTamanho } from "@/lib/documentos";
import { STATUS_APROVACAO_LABEL } from "@/lib/arquitetura";

// Página sempre dinâmica (conta visitas e mostra dados atuais) e fora de buscadores.
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Acompanhamento da obra",
  robots: { index: false, follow: false },
};

/** Cores fixas (sem tokens de tema) para a situação de cada etapa. */
const COR_ETAPA: Record<string, string> = {
  CONCLUIDA: "bg-green-600",
  ATRASADA: "bg-red-600",
  EM_ANDAMENTO: "bg-blue-600",
  PLANEJADA: "bg-neutral-400",
};

const COR_APROVACAO: Record<string, string> = {
  APROVADO: "bg-green-100 text-green-800",
  INDEFERIDO: "bg-red-100 text-red-800",
  EXIGENCIA: "bg-amber-100 text-amber-800",
  EM_ANALISE: "bg-blue-100 text-blue-800",
  PROTOCOLADO: "bg-blue-100 text-blue-800",
  PREPARACAO: "bg-neutral-100 text-neutral-700",
};

function Aviso({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="mx-auto mt-16 max-w-md rounded-xl bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
        <HardHat className="h-7 w-7 text-neutral-500" />
      </div>
      <h1 className="text-lg font-bold">{titulo}</h1>
      <p className="mt-2 text-sm text-neutral-600">{texto}</p>
    </div>
  );
}

function avisoPorMotivo(motivo: MotivoBloqueio) {
  if (motivo === "EXPIRADO")
    return <Aviso titulo="Este link expirou" texto="O prazo de acompanhamento terminou. Fale com o escritório para receber um link novo." />;
  if (motivo === "REVOGADO")
    return <Aviso titulo="Link indisponível" texto="Este link de acompanhamento não está mais ativo. Fale com o escritório responsável." />;
  return <Aviso titulo="Indisponível no momento" texto="O acompanhamento desta obra está temporariamente fora do ar. Tente novamente mais tarde." />;
}

export default async function PortalObraPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const r = await portalPorToken(token);
  if (!r.ok) {
    if (r.motivo === "NAO_ENCONTRADO") notFound();
    return avisoPorMotivo(r.motivo);
  }
  const { portal } = r;
  const hoje = new Date();

  // IMPORTANTE: `select` explícito em tudo. Nada de custo, equipe, financeiro,
  // notas internas ou dados do cliente (CPF/telefone) pode entrar aqui.
  const projeto = await prisma.projeto.findFirst({
    where: { id: portal.projetoId, organizacaoId: portal.organizacaoId },
    select: {
      titulo: true,
      tipo: true,
      endereco: true,
      areaM2: true,
      status: true,
      dataInicioPrev: true,
      dataFimPrev: true,
      etapas: {
        orderBy: { ordem: "asc" },
        select: { id: true, nome: true, inicioPrev: true, fimPrev: true, fimReal: true, progresso: true },
      },
    },
  });
  if (!projeto) notFound();

  const [org, diarios, documentos, aprovacoes] = await Promise.all([
    prisma.organizacao.findUnique({
      where: { id: portal.organizacaoId },
      select: { nome: true, logoData: true },
    }),
    portal.mostrarDiario
      ? prisma.diarioObra.findMany({
          where: { projetoId: portal.projetoId, organizacaoId: portal.organizacaoId },
          orderBy: { data: "desc" },
          take: 30,
          // Sem `ocorrencias`, `maoDeObra`, checklist nem autor — são internos.
          select: {
            id: true,
            data: true,
            clima: true,
            atividades: true,
            fotos: { select: { id: true, legenda: true } },
          },
        })
      : Promise.resolve([]),
    portal.mostrarDocumentos
      ? prisma.documento.findMany({
          where: { projetoId: portal.projetoId, organizacaoId: portal.organizacaoId, visivelCliente: true },
          orderBy: { criadoEm: "desc" },
          select: { id: true, nome: true, categoria: true, prancha: true, revisao: true, tamanho: true, criadoEm: true },
        })
      : Promise.resolve([]),
    portal.mostrarAprovacoes
      ? prisma.aprovacao.findMany({
          where: { projetoId: portal.projetoId, organizacaoId: portal.organizacaoId },
          orderBy: { criadoEm: "asc" },
          // Sem `observacoes` (pode conter estratégia/negociação) nem responsável.
          select: { id: true, orgao: true, descricao: true, status: true, dataProtocolo: true },
        })
      : Promise.resolve([]),
  ]);

  await registrarVisita(portal.portalId);

  const status = statusCalculadoProjeto(projeto.status, projeto.dataInicioPrev, projeto.dataFimPrev, projeto.etapas, hoje);
  const progressoGeral =
    projeto.etapas.length > 0
      ? Math.round(projeto.etapas.reduce((s, e) => s + e.progresso, 0) / projeto.etapas.length)
      : 0;

  return (
    <div className="space-y-5">
      {/* Marca do escritório */}
      <header className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
        {org?.logoData ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={org.logoData} alt={org.nome} className="h-10 w-auto max-w-[140px] object-contain" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-800 text-white">
            <HardHat className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate font-bold leading-tight">{org?.nome ?? "Acompanhamento"}</p>
          <p className="text-xs text-neutral-500">Acompanhamento da obra</p>
        </div>
      </header>

      {/* Resumo */}
      <section className="rounded-xl bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-xl font-bold">{projeto.titulo}</h1>
            <p className="mt-0.5 text-sm text-neutral-600">
              {projeto.tipo}
              {projeto.areaM2 ? ` · ${projeto.areaM2} m²` : ""}
            </p>
          </div>
          <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
            {STATUS_LABEL[status]}
          </span>
        </div>

        {projeto.endereco && (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-neutral-600">
            <MapPin className="h-4 w-4 shrink-0" /> {projeto.endereco}
          </p>
        )}
        <p className="mt-1 flex items-center gap-1.5 text-sm text-neutral-600">
          <CalendarRange className="h-4 w-4 shrink-0" />
          {formatarData(projeto.dataInicioPrev)} a {formatarData(projeto.dataFimPrev)}
        </p>

        <div className="mt-4">
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-sm font-medium">Andamento geral</span>
            <span className="text-2xl font-bold text-blue-700">{progressoGeral}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-200">
            <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progressoGeral}%` }} />
          </div>
        </div>
      </section>

      {/* Etapas */}
      {portal.mostrarCronograma && projeto.etapas.length > 0 && (
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-bold">Etapas da obra</h2>
          <ul className="space-y-4">
            {projeto.etapas.map((e) => {
              const st = statusCalculadoEtapa(e, hoje);
              return (
                <li key={e.id}>
                  <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-2">
                    <span className="font-medium">{e.nome}</span>
                    <span className="text-xs text-neutral-500">
                      {formatarData(e.inicioPrev)}–{formatarData(e.fimPrev)} · {STATUS_LABEL[st]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
                      <div className={`h-full rounded-full ${COR_ETAPA[st] ?? "bg-blue-600"}`} style={{ width: `${e.progresso}%` }} />
                    </div>
                    <span className="w-10 shrink-0 text-right text-xs font-medium text-neutral-600">{e.progresso}%</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Aprovações */}
      {portal.mostrarAprovacoes && aprovacoes.length > 0 && (
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 font-bold">
            <Stamp className="h-4 w-4 text-neutral-500" /> Aprovações e licenças
          </h2>
          <ul className="space-y-2">
            {aprovacoes.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-2 last:border-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{a.descricao}</p>
                  <p className="text-xs text-neutral-500">
                    {a.orgao}
                    {a.dataProtocolo ? ` · protocolado em ${formatarData(a.dataProtocolo)}` : ""}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${COR_APROVACAO[a.status] ?? "bg-neutral-100 text-neutral-700"}`}>
                  {STATUS_APROVACAO_LABEL[a.status]}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Documentos liberados */}
      {portal.mostrarDocumentos && documentos.length > 0 && (
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 font-bold">
            <FileText className="h-4 w-4 text-neutral-500" /> Documentos
          </h2>
          <ul className="space-y-2">
            {documentos.map((d) => (
              <li key={d.id}>
                <a
                  href={urlDocumento(d.id, portal.token)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 px-3 py-2 hover:border-blue-500"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{d.prancha ?? d.nome}</span>
                    <span className="block text-xs text-neutral-500">
                      {CATEGORIA_DOCUMENTO_LABEL[d.categoria] ?? d.categoria}
                      {d.revisao ? ` · ${d.revisao}` : ""} · {formatarTamanho(d.tamanho)}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-medium text-blue-700">Abrir</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Diário da obra */}
      {portal.mostrarDiario && diarios.length > 0 && (
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 font-bold">
            <Camera className="h-4 w-4 text-neutral-500" /> Diário da obra
          </h2>
          <ul className="space-y-5">
            {diarios.map((d) => (
              <li key={d.id} className="border-b border-neutral-100 pb-5 last:border-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{formatarData(d.data)}</span>
                  {d.clima && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                      <CloudSun className="h-3 w-3" /> {d.clima}
                    </span>
                  )}
                </div>
                {d.atividades && <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700">{d.atividades}</p>}
                {d.fotos.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {d.fotos.map((f) => (
                      <a key={f.id} href={urlFoto(f.id, portal.token)} target="_blank" rel="noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={urlFoto(f.id, portal.token)}
                          alt={f.legenda ?? "Foto da obra"}
                          loading="lazy"
                          className="h-32 w-full rounded-lg border border-neutral-200 object-cover"
                        />
                      </a>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="flex items-center justify-center gap-1.5 pb-2 text-center text-xs text-neutral-500">
        <Clock className="h-3 w-3" />
        Atualizado em {formatarData(hoje)} · {org?.nome ?? ""}
      </footer>
    </div>
  );
}
