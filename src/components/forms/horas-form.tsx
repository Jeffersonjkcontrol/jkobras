"use client";

import { Input, Label, Textarea, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useModalClose } from "@/components/ui/modal";
import { paraInputDate } from "@/lib/utils";

type Opcao = { id: string; nome: string };
type Apontamento = {
  id: string;
  data: Date;
  horas: number;
  descricao: string | null;
  valorHora: number | null;
  etapaId: string | null;
  userId: string | null;
};

export function HorasForm({
  action,
  projetoId,
  fases,
  pessoas,
  podeEscolherPessoa = false,
  apontamento,
}: {
  action: (formData: FormData) => void;
  projetoId: string;
  fases: Opcao[];
  pessoas: Opcao[];
  podeEscolherPessoa?: boolean;
  apontamento?: Apontamento;
}) {
  const close = useModalClose();
  const h = apontamento;
  return (
    <form action={action} onSubmit={() => setTimeout(close, 50)} className="space-y-4">
      <input type="hidden" name="projetoId" value={projetoId} />
      {h && <input type="hidden" name="id" value={h.id} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="data">Data *</Label>
          <Input id="data" name="data" type="date" required defaultValue={paraInputDate(h?.data ?? new Date())} />
        </div>
        <div>
          <Label htmlFor="horas">Horas *</Label>
          <Input id="horas" name="horas" type="number" step="0.25" min="0.25" required defaultValue={h?.horas ?? ""} placeholder="Ex.: 3.5" />
        </div>
        <div>
          <Label htmlFor="valorHora">Valor/hora (R$)</Label>
          <Input id="valorHora" name="valorHora" type="number" step="0.01" min="0" defaultValue={h?.valorHora ?? ""} placeholder="Ex.: 180" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="etapaId">Fase do projeto</Label>
          <Select id="etapaId" name="etapaId" defaultValue={h?.etapaId ?? ""}>
            <option value="">— Sem fase —</option>
            {fases.map((f) => (
              <option key={f.id} value={f.id}>{f.nome}</option>
            ))}
          </Select>
        </div>
        {podeEscolherPessoa && (
          <div>
            <Label htmlFor="userId">Quem executou</Label>
            <Select id="userId" name="userId" defaultValue={h?.userId ?? ""}>
              <option value="">— Eu mesmo —</option>
              {pessoas.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </Select>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="descricao">O que foi feito</Label>
        <Textarea id="descricao" name="descricao" defaultValue={h?.descricao ?? ""} placeholder="Ex.: Ajustes na planta baixa após reunião com o cliente" />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={close}>Cancelar</Button>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  );
}
