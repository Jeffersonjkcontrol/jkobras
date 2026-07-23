"use client";

import { Input, Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useModalClose } from "@/components/ui/modal";
import { paraInputDate } from "@/lib/utils";
import { CATEGORIAS } from "@/lib/financeiro";

type Lancamento = {
  id: string;
  descricao: string;
  tipo: string;
  status: string;
  categoria: string | null;
  valor: number;
  data: Date;
};

export function LancamentoForm({
  action,
  lancamento,
  projetoId,
}: {
  action: (formData: FormData) => void;
  lancamento?: Lancamento;
  projetoId: string;
}) {
  const close = useModalClose();
  return (
    <form action={action} onSubmit={() => setTimeout(close, 50)} className="space-y-4">
      <input type="hidden" name="projetoId" value={projetoId} />
      {lancamento && <input type="hidden" name="id" value={lancamento.id} />}
      <div>
        <Label htmlFor="descricao">Descrição *</Label>
        <Input id="descricao" name="descricao" required defaultValue={lancamento?.descricao} placeholder="Ex.: Compra de cimento — 1ª parcela" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="tipo">Tipo *</Label>
          <Select id="tipo" name="tipo" defaultValue={lancamento?.tipo ?? "DESPESA"}>
            <option value="DESPESA">Despesa</option>
            <option value="RECEITA">Receita</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="status">Situação *</Label>
          <Select id="status" name="status" defaultValue={lancamento?.status ?? "REALIZADO"}>
            <option value="REALIZADO">Realizado</option>
            <option value="PREVISTO">Previsto (orçado)</option>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="valor">Valor (R$) *</Label>
          <Input id="valor" name="valor" type="number" step="0.01" min="0" required defaultValue={lancamento?.valor ?? ""} />
        </div>
        <div>
          <Label htmlFor="data">Data *</Label>
          <Input id="data" name="data" type="date" required defaultValue={paraInputDate(lancamento?.data ?? new Date())} />
        </div>
      </div>
      <div>
        <Label htmlFor="categoria">Categoria</Label>
        <Select id="categoria" name="categoria" defaultValue={lancamento?.categoria ?? ""}>
          <option value="">— Sem categoria —</option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={close}>Cancelar</Button>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  );
}
