"use client";

import { Input, Label, Textarea, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useModalClose } from "@/components/ui/modal";

type SubEtapa = {
  id: string;
  titulo: string;
  descricao: string | null;
  status: string;
  ordem: number;
  responsavelProfId?: string | null;
};
type Prof = { id: string; nome: string; funcao: string };

export function SubEtapaForm({
  action,
  sub,
  etapaId,
  projetoId,
  proximaOrdem,
  profissionais = [],
}: {
  action: (formData: FormData) => void;
  sub?: SubEtapa;
  etapaId: string;
  projetoId: string;
  proximaOrdem?: number;
  profissionais?: Prof[];
}) {
  const close = useModalClose();
  return (
    <form action={action} onSubmit={() => setTimeout(close, 50)} className="space-y-4">
      <input type="hidden" name="etapaId" value={etapaId} />
      <input type="hidden" name="projetoId" value={projetoId} />
      {sub && <input type="hidden" name="id" value={sub.id} />}
      <div>
        <Label htmlFor="titulo">Título da sub-etapa *</Label>
        <Input id="titulo" name="titulo" required defaultValue={sub?.titulo} placeholder="Ex.: Comprar material" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue={sub?.status ?? "PENDENTE"}>
            <option value="PENDENTE">Pendente</option>
            <option value="EM_ANDAMENTO">Em andamento</option>
            <option value="CONCLUIDA">Concluída</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="ordem">Ordem</Label>
          <Input id="ordem" name="ordem" type="number" min="0" defaultValue={sub?.ordem ?? proximaOrdem ?? 0} />
        </div>
      </div>
      <div>
        <Label htmlFor="responsavelProfId">Responsável (equipe)</Label>
        <Select id="responsavelProfId" name="responsavelProfId" defaultValue={sub?.responsavelProfId ?? ""}>
          <option value="">— Sem responsável —</option>
          {profissionais.map((p) => (
            <option key={p.id} value={p.id}>{p.nome} · {p.funcao}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea id="descricao" name="descricao" defaultValue={sub?.descricao ?? ""} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={close}>Cancelar</Button>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  );
}
