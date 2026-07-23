"use client";

import { Input, Label, Textarea, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useModalClose } from "@/components/ui/modal";
import { paraInputDate } from "@/lib/utils";
import { STATUS_TAREFA, STATUS_TAREFA_LABEL } from "@/lib/equipe";

type Prof = { id: string; nome: string; funcao: string };
type Tarefa = {
  id: string;
  titulo: string;
  descricao: string | null;
  profissionalId: string | null;
  status: string;
  prazo: Date | null;
  custo: number | null;
};

export function TarefaForm({
  action,
  projetoId,
  profissionais,
  tarefa,
}: {
  action: (formData: FormData) => void;
  projetoId: string;
  profissionais: Prof[];
  tarefa?: Tarefa;
}) {
  const close = useModalClose();
  const t = tarefa;
  return (
    <form action={action} onSubmit={() => setTimeout(close, 50)} className="space-y-4">
      <input type="hidden" name="projetoId" value={projetoId} />
      {t && <input type="hidden" name="id" value={t.id} />}

      <div>
        <Label htmlFor="titulo">Tarefa *</Label>
        <Input id="titulo" name="titulo" required defaultValue={t?.titulo} placeholder="Ex.: Assentar piso do 1º pavimento" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="profissionalId">Responsável</Label>
          <Select id="profissionalId" name="profissionalId" defaultValue={t?.profissionalId ?? ""}>
            <option value="">— Sem responsável —</option>
            {profissionais.map((p) => (
              <option key={p.id} value={p.id}>{p.nome} · {p.funcao}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue={t?.status ?? "PENDENTE"}>
            {STATUS_TAREFA.map((st) => (
              <option key={st} value={st}>{STATUS_TAREFA_LABEL[st]}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="prazo">Prazo</Label>
          <Input id="prazo" name="prazo" type="date" defaultValue={t?.prazo ? paraInputDate(t.prazo) : ""} />
        </div>
        <div>
          <Label htmlFor="custo">Custo (R$)</Label>
          <Input id="custo" name="custo" type="number" step="0.01" min="0" defaultValue={t?.custo ?? ""} placeholder="Ex.: 500" />
        </div>
      </div>

      <div>
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea id="descricao" name="descricao" defaultValue={t?.descricao ?? ""} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={close}>Cancelar</Button>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  );
}
