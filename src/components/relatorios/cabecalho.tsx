import Link from "next/link";
import { ArrowLeft, HardHat } from "lucide-react";
import { formatarData } from "@/lib/utils";
import { BotaoImprimir } from "./botao-imprimir";

type Org = { nome: string; logoData: string | null };

/** Barra de ações (some na impressão) + cabeçalho com a marca do escritório. */
export function CabecalhoRelatorio({
  org,
  titulo,
  subtitulo,
  voltarHref,
}: {
  org: Org;
  titulo: string;
  subtitulo?: string;
  voltarHref: string;
}) {
  return (
    <>
      <div className="nao-imprimir mb-6 flex items-center justify-between">
        <Link href={voltarHref} className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <BotaoImprimir />
      </div>

      <header className="evitar-quebra mb-6 flex items-start justify-between gap-4 border-b-2 border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          {org.logoData ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={org.logoData} alt={org.nome} className="h-14 w-auto max-w-[180px] object-contain" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-800 text-white">
              <HardHat className="h-6 w-6" />
            </div>
          )}
          <p className="text-lg font-bold leading-tight">{org.nome}</p>
        </div>
        <div className="text-right">
          <p className="text-base font-bold uppercase tracking-wide">{titulo}</p>
          {subtitulo && <p className="text-sm text-neutral-600">{subtitulo}</p>}
          <p className="mt-0.5 text-xs text-neutral-500">Emitido em {formatarData(new Date())}</p>
        </div>
      </header>
    </>
  );
}
