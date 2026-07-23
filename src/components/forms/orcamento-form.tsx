"use client";

import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useModalClose } from "@/components/ui/modal";

type Orcamento = {
  id: string;
  titulo: string;
  observacoes: string | null;
  validadeDias: number | null;
};

export function OrcamentoForm({
  action,
  orcamento,
  projetoId,
}: {
  action: (formData: FormData) => void;
  orcamento?: Orcamento;
  projetoId: string;
}) {
  const close = useModalClose();
  return (
    <form action={action} onSubmit={() => setTimeout(close, 50)} className="space-y-4">
      <input type="hidden" name="projetoId" value={projetoId} />
      {orcamento && <input type="hidden" name="id" value={orcamento.id} />}
      <div>
        <Label htmlFor="titulo">Título da proposta *</Label>
        <Input id="titulo" name="titulo" required defaultValue={orcamento?.titulo} placeholder="Ex.: Proposta de execução — v1" />
      </div>
      <div>
        <Label htmlFor="validadeDias">Validade (dias)</Label>
        <Input id="validadeDias" name="validadeDias" type="number" min="0" defaultValue={orcamento?.validadeDias ?? ""} placeholder="Ex.: 30" />
      </div>
      <div>
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea id="observacoes" name="observacoes" defaultValue={orcamento?.observacoes ?? ""} placeholder="Condições de pagamento, exclusões, prazos…" />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={close}>Cancelar</Button>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  );
}
