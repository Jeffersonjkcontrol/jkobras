import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sessaoOrg } from "@/lib/sessao";
import { CabecalhoRelatorio } from "@/components/relatorios/cabecalho";
import { formatarData, formatarDataHora, paraInputDate } from "@/lib/utils";
import { urlFoto } from "@/lib/arquivos";
import { par, type SP } from "@/lib/listagem";

const ITEM_LABEL: Record<string, string> = { OK: "OK", ATENCAO: "Atenção", PROBLEMA: "Problema" };
const ITEM_COR: Record<string, string> = {
  OK: "border-green-600 text-green-700",
  ATENCAO: "border-amber-600 text-amber-700",
  PROBLEMA: "border-red-600 text-red-700",
};

function inicioDoDia(d: Date) {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}
function fimDoDia(d: Date) {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}

export default async function RelatorioRDOPage({
  params,
  searchParams,
}: {
  params: Promise<{ projetoId: string }>;
  searchParams: Promise<SP>;
}) {
  const { projetoId } = await params;
  const sp = await searchParams;
  const s = await sessaoOrg();
  const org = s.organizacaoId;

  // Padrão: últimos 7 dias.
  const hoje = new Date();
  const padraoDe = new Date(hoje);
  padraoDe.setDate(padraoDe.getDate() - 6);
  const deStr = par(sp, "de") ?? paraInputDate(padraoDe);
  const ateStr = par(sp, "ate") ?? paraInputDate(hoje);
  const de = inicioDoDia(new Date(deStr));
  const ate = fimDoDia(new Date(ateStr));

  const [projeto, organizacao] = await Promise.all([
    prisma.projeto.findFirst({
      where: { id: projetoId, organizacaoId: org },
      select: {
        id: true,
        titulo: true,
        endereco: true,
        cliente: { select: { nome: true } },
        diarios: {
          where: { data: { gte: de, lte: ate } },
          orderBy: { data: "asc" },
          include: {
            itens: { orderBy: { ordem: "asc" } },
            fotos: true,
            criadoPor: { select: { nome: true } },
          },
        },
      },
    }),
    prisma.organizacao.findUnique({ where: { id: org }, select: { nome: true, logoData: true } }),
  ]);
  if (!projeto || !organizacao) notFound();

  const totalProblemas = projeto.diarios.reduce(
    (n, r) => n + r.itens.filter((i) => i.status === "PROBLEMA").length,
    0
  );
  const totalAtencao = projeto.diarios.reduce(
    (n, r) => n + r.itens.filter((i) => i.status === "ATENCAO").length,
    0
  );
  const totalFotos = projeto.diarios.reduce((n, r) => n + r.fotos.length, 0);

  return (
    <div>
      <CabecalhoRelatorio
        org={organizacao}
        titulo="Diário de Obra (RDO)"
        subtitulo={`${formatarData(de)} a ${formatarData(ate)}`}
        voltarHref={`/projetos/${projeto.id}/rdo`}
      />

      {/* Filtro de período — só na tela */}
      <form className="nao-imprimir mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-neutral-300 bg-neutral-50 p-3 text-sm">
        <div>
          <label htmlFor="de" className="mb-1 block text-xs font-medium text-neutral-600">De</label>
          <input type="date" id="de" name="de" defaultValue={deStr} className="h-9 rounded border border-neutral-300 px-2" />
        </div>
        <div>
          <label htmlFor="ate" className="mb-1 block text-xs font-medium text-neutral-600">Até</label>
          <input type="date" id="ate" name="ate" defaultValue={ateStr} className="h-9 rounded border border-neutral-300 px-2" />
        </div>
        <button type="submit" className="h-9 rounded bg-neutral-800 px-4 font-medium text-white hover:bg-neutral-700">
          Aplicar período
        </button>
      </form>

      {/* Identificação + resumo */}
      <section className="evitar-quebra mb-6 grid grid-cols-2 gap-6 text-sm">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Obra</p>
          <p className="font-semibold">{projeto.titulo}</p>
          <p className="text-neutral-700">Cliente: {projeto.cliente.nome}</p>
          {projeto.endereco && <p className="text-neutral-700">{projeto.endereco}</p>}
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Resumo do período</p>
          <p className="text-neutral-700">
            <strong>{projeto.diarios.length}</strong> dia(s) registrado(s) · <strong>{totalFotos}</strong> foto(s)
          </p>
          <p className="text-neutral-700">
            <strong>{totalAtencao}</strong> ponto(s) de atenção · <strong>{totalProblemas}</strong> problema(s)
          </p>
        </div>
      </section>

      {projeto.diarios.length === 0 ? (
        <p className="rounded border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
          Nenhum registro de diário neste período.
        </p>
      ) : (
        <div className="space-y-5">
          {projeto.diarios.map((r) => (
            <section key={r.id} className="evitar-quebra rounded border border-neutral-300 p-4 text-sm">
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 border-b border-neutral-200 pb-2">
                <p className="text-base font-bold">{formatarData(r.data)}</p>
                <p className="text-xs text-neutral-500">
                  {r.clima && <>Clima: {r.clima} · </>}
                  {r.maoDeObra && <>Mão de obra: {r.maoDeObra} · </>}
                  {r.criadoPor?.nome && <>Registrado por {r.criadoPor.nome} </>}
                  ({formatarDataHora(r.criadoEm)})
                </p>
              </div>

              {r.itens.length > 0 && (
                <div className="mb-2">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Situação no canteiro</p>
                  <div className="flex flex-wrap gap-1.5">
                    {r.itens.map((it) => (
                      <span key={it.id} className={`rounded border px-2 py-0.5 text-xs ${ITEM_COR[it.status] ?? "border-neutral-400 text-neutral-700"}`}>
                        {it.titulo}: <strong>{ITEM_LABEL[it.status] ?? it.status}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {r.atividades && (
                <p className="mb-1">
                  <span className="text-neutral-500">Atividades: </span>
                  <span className="whitespace-pre-wrap">{r.atividades}</span>
                </p>
              )}
              {r.ocorrencias && (
                <p className="mb-1">
                  <span className="text-neutral-500">Ocorrências: </span>
                  <span className="whitespace-pre-wrap">{r.ocorrencias}</span>
                </p>
              )}

              {r.fotos.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {r.fotos.map((f) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={f.id}
                      src={urlFoto(f.id)}
                      alt={f.legenda ?? "Foto da obra"}
                      className="h-28 w-28 rounded border border-neutral-300 object-cover"
                    />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      <p className="mt-8 text-center text-xs text-neutral-400">
        {organizacao.nome} · {projeto.titulo} · Emitido em {formatarData(new Date())}
      </p>
    </div>
  );
}
