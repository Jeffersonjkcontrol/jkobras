"use client";

import { Input, Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useModalClose } from "@/components/ui/modal";
import { UNIDADES } from "@/lib/orcamentos";

type Item = {
  id: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  ordem: number;
};

export function ItemOrcamentoForm({
  action,
  item,
  orcamentoId,
  proximaOrdem,
}: {
  action: (formData: FormData) => void;
  item?: Item;
  orcamentoId: string;
  proximaOrdem?: number;
}) {
  const close = useModalClose();
  return (
    <form action={action} onSubmit={() => setTimeout(close, 50)} className="space-y-4">
      <input type="hidden" name="orcamentoId" value={orcamentoId} />
      {item && <input type="hidden" name="id" value={item.id} />}
      <div>
        <Label htmlFor="descricao">Descrição *</Label>
        <Input id="descricao" name="descricao" required defaultValue={item?.descricao} placeholder="Ex.: Concreto FCK 25 usinado" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="unidade">Unidade</Label>
          <Select id="unidade" name="unidade" defaultValue={item?.unidade ?? "un"}>
            {UNIDADES.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="quantidade">Quantidade *</Label>
          <Input id="quantidade" name="quantidade" type="number" step="0.01" min="0" required defaultValue={item?.quantidade ?? 1} />
        </div>
        <div>
          <Label htmlFor="valorUnitario">Valor unitário (R$) *</Label>
          <Input id="valorUnitario" name="valorUnitario" type="number" step="0.01" min="0" required defaultValue={item?.valorUnitario ?? 0} />
        </div>
      </div>
      <div>
        <Label htmlFor="ordem">Ordem</Label>
        <Input id="ordem" name="ordem" type="number" min="0" defaultValue={item?.ordem ?? proximaOrdem ?? 0} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={close}>Cancelar</Button>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  );
}
