"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Link2, RefreshCw, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { paraInputDate } from "@/lib/utils";

type Portal = {
  token: string;
  ativo: boolean;
  expiraEm: Date | null;
  visitas: number;
  ultimoAcessoEm: Date | null;
  mostrarCronograma: boolean;
  mostrarDiario: boolean;
  mostrarDocumentos: boolean;
  mostrarAprovacoes: boolean;
};

type Acoes = {
  gerar: (formData: FormData) => void;
  revogar: (formData: FormData) => void;
  regenerar: (formData: FormData) => void;
  salvarOpcoes: (formData: FormData) => void;
};

function Opcao({ name, label, descricao, marcado }: { name: string; label: string; descricao: string; marcado: boolean }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border p-2.5 hover:bg-surface-muted">
      <input type="checkbox" name={name} defaultChecked={marcado} className="mt-0.5 h-4 w-4 rounded border-border" />
      <span>
        <span className="block text-sm font-medium text-foreground">{label}</span>
        <span className="block text-xs text-muted">{descricao}</span>
      </span>
    </label>
  );
}

export function CompartilharForm({
  projetoId,
  portal,
  acoes,
}: {
  projetoId: string;
  portal: Portal | null;
  acoes: Acoes;
}) {
  const [url, setUrl] = useState("");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (portal?.token) setUrl(`${window.location.origin}/obra/${portal.token}`);
  }, [portal?.token]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // navegador sem permissão de área de transferência: o usuário copia manualmente
    }
  }

  // Ainda não existe link para este projeto
  if (!portal) {
    return (
      <form action={acoes.gerar} className="space-y-4">
        <input type="hidden" name="projetoId" value={projetoId} />
        <p className="text-sm text-muted">
          Crie um link para o cliente acompanhar esta obra pelo celular — sem senha e sem criar conta.
          Você escolhe o que ele vê e pode revogar quando quiser.
        </p>
        <div className="rounded-lg border border-border bg-surface-muted/40 p-3 text-xs text-muted">
          O cliente vê andamento, etapas, fotos e o que você liberar. <strong className="text-foreground">Nunca</strong> vê
          custos, equipe, valores ou anotações internas.
        </div>
        <div className="flex justify-end">
          <Button type="submit"><Link2 className="mr-2 h-4 w-4" /> Gerar link</Button>
        </div>
      </form>
    );
  }

  const expirado = !!portal.expiraEm && new Date(portal.expiraEm).getTime() < Date.now();

  return (
    <div className="space-y-5">
      {/* Situação */}
      {!portal.ativo ? (
        <div className="rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-foreground">
          Este link está <strong>revogado</strong> — quem tiver o endereço não consegue mais ver a obra.
          <form action={acoes.gerar} className="mt-2">
            <input type="hidden" name="projetoId" value={projetoId} />
            <Button type="submit" size="sm" variant="outline">Reativar link</Button>
          </form>
        </div>
      ) : expirado ? (
        <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-foreground">
          O prazo deste link <strong>venceu</strong>. Ajuste a validade abaixo para reabrir o acesso.
        </div>
      ) : null}

      {/* Link */}
      <div>
        <Label htmlFor="link-portal">Link do cliente</Label>
        <div className="flex gap-2">
          <Input id="link-portal" readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="font-mono text-xs" />
          <Button type="button" variant="outline" onClick={copiar} title="Copiar link">
            {copiado ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <p className="mt-1 text-xs text-muted">
          {portal.visitas > 0
            ? `${portal.visitas} visita(s)${portal.ultimoAcessoEm ? ` · última em ${new Date(portal.ultimoAcessoEm).toLocaleDateString("pt-BR")}` : ""}`
            : "Ainda não foi acessado."}
        </p>
      </div>

      {/* O que mostrar + validade */}
      <form action={acoes.salvarOpcoes} className="space-y-3 border-t border-border pt-4">
        <input type="hidden" name="projetoId" value={projetoId} />
        <p className="text-sm font-medium text-foreground">O que o cliente vê</p>
        <div className="space-y-2">
          <Opcao name="mostrarCronograma" label="Andamento e etapas" descricao="Progresso de cada etapa e prazos" marcado={portal.mostrarCronograma} />
          <Opcao name="mostrarDiario" label="Diário e fotos da obra" descricao="Fotos e o que foi executado em cada dia" marcado={portal.mostrarDiario} />
          <Opcao name="mostrarDocumentos" label="Documentos liberados" descricao="Só os arquivos marcados como visíveis na aba Documentos" marcado={portal.mostrarDocumentos} />
          <Opcao name="mostrarAprovacoes" label="Aprovações e licenças" descricao="Situação dos protocolos em órgãos" marcado={portal.mostrarAprovacoes} />
        </div>
        <div>
          <Label htmlFor="expiraEm">Validade do link (opcional)</Label>
          <Input id="expiraEm" name="expiraEm" type="date" defaultValue={portal.expiraEm ? paraInputDate(portal.expiraEm) : ""} />
          <p className="mt-1 text-xs text-muted">Em branco = sem prazo.</p>
        </div>
        <div className="flex justify-end">
          <Button type="submit" size="sm">Salvar</Button>
        </div>
      </form>

      {/* Ações de risco */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
        <form action={acoes.regenerar}>
          <input type="hidden" name="projetoId" value={projetoId} />
          <Button type="submit" variant="outline" size="sm" title="Cria um endereço novo e invalida o atual">
            <RefreshCw className="mr-1 h-4 w-4" /> Gerar novo endereço
          </Button>
        </form>
        {portal.ativo && (
          <form action={acoes.revogar}>
            <input type="hidden" name="projetoId" value={projetoId} />
            <Button type="submit" variant="danger" size="sm">
              <EyeOff className="mr-1 h-4 w-4" /> Revogar acesso
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
