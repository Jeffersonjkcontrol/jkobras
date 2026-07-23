"use client";

import { useState } from "react";
import { Input, Label, Textarea, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useModalClose } from "@/components/ui/modal";
import { TIPO_CUSTO, TIPO_CUSTO_LABEL } from "@/lib/equipe";

type ProfOpc = { id: string; nome: string; funcao: string; tipoCusto: string; custoValor: number | null };
type Alocacao = {
  id: string;
  profissionalId: string;
  profissionalNome: string;
  funcaoNaObra: string | null;
  tipoCusto: string;
  custoValor: number | null;
  observacoes: string | null;
};

export function AlocacaoForm({
  action,
  projetoId,
  profissionais,
  alocacao,
}: {
  action: (formData: FormData) => void;
  projetoId: string;
  profissionais: ProfOpc[];
  alocacao?: Alocacao;
}) {
  const close = useModalClose();
  const editando = !!alocacao;
  const [profId, setProfId] = useState(alocacao?.profissionalId ?? "");
  const [funcao, setFuncao] = useState(alocacao?.funcaoNaObra ?? "");
  const [tipoCusto, setTipoCusto] = useState(alocacao?.tipoCusto ?? "DIARIA");
  const [custo, setCusto] = useState<string>(alocacao?.custoValor != null ? String(alocacao.custoValor) : "");

  function escolher(id: string) {
    setProfId(id);
    const p = profissionais.find((x) => x.id === id);
    if (p) {
      setFuncao(p.funcao);
      setTipoCusto(p.tipoCusto);
      setCusto(p.custoValor != null ? String(p.custoValor) : "");
    }
  }

  return (
    <form action={action} onSubmit={() => setTimeout(close, 50)} className="space-y-4">
      <input type="hidden" name="projetoId" value={projetoId} />
      {editando && <input type="hidden" name="id" value={alocacao!.id} />}

      {editando ? (
        <>
          <input type="hidden" name="profissionalId" value={alocacao!.profissionalId} />
          <div>
            <Label>Profissional</Label>
            <p className="rounded-lg border border-border bg-surface-muted/40 px-3 py-2 text-sm text-foreground">{alocacao!.profissionalNome}</p>
          </div>
        </>
      ) : (
        <div>
          <Label htmlFor="profissionalId">Profissional *</Label>
          <Select id="profissionalId" name="profissionalId" required value={profId} onChange={(e) => escolher(e.target.value)}>
            <option value="" disabled>— Selecione —</option>
            {profissionais.map((p) => (
              <option key={p.id} value={p.id}>{p.nome} · {p.funcao}</option>
            ))}
          </Select>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="funcaoNaObra">Função nesta obra</Label>
          <Input id="funcaoNaObra" name="funcaoNaObra" value={funcao} onChange={(e) => setFuncao(e.target.value)} placeholder="Ex.: Pedreiro" />
        </div>
        <div>
          <Label htmlFor="tipoCusto">Forma de custo</Label>
          <Select id="tipoCusto" name="tipoCusto" value={tipoCusto} onChange={(e) => setTipoCusto(e.target.value)}>
            {TIPO_CUSTO.map((t) => (
              <option key={t} value={t}>{TIPO_CUSTO_LABEL[t]}</option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="custoValor">Valor acordado (R$)</Label>
        <Input id="custoValor" name="custoValor" type="number" step="0.01" min="0" value={custo} onChange={(e) => setCusto(e.target.value)} placeholder="Ex.: 180 (diária) ou 8000 (empreitada)" />
      </div>
      <div>
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea id="observacoes" name="observacoes" defaultValue={alocacao?.observacoes ?? ""} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={close}>Cancelar</Button>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  );
}
