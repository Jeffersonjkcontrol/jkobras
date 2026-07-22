"use client";

import { Input, Label, Textarea, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useModalClose } from "@/components/ui/modal";
import { paraInputDate } from "@/lib/utils";
import { TIPOS_PROJETO } from "@/lib/projetos";

type Opcao = { id: string; nome: string };
type Projeto = {
  id: string;
  titulo: string;
  clienteId: string;
  tipo: string;
  descricao: string | null;
  endereco: string | null;
  areaM2: number | null;
  valorContrato: number | null;
  status: string;
  dataInicioPrev: Date;
  dataFimPrev: Date;
  responsavelId: string | null;
};

export function ProjetoForm({
  action,
  projeto,
  clientes,
  responsaveis,
}: {
  action: (formData: FormData) => void;
  projeto?: Projeto;
  clientes: Opcao[];
  responsaveis: Opcao[];
}) {
  const close = useModalClose();
  return (
    <form action={action} onSubmit={() => setTimeout(close, 50)} className="space-y-4">
      {projeto && <input type="hidden" name="id" value={projeto.id} />}
      <div>
        <Label htmlFor="titulo">Título do projeto *</Label>
        <Input id="titulo" name="titulo" required defaultValue={projeto?.titulo} placeholder="Ex.: Residência Silva" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="clienteId">Cliente *</Label>
          <Select id="clienteId" name="clienteId" required defaultValue={projeto?.clienteId ?? ""}>
            <option value="" disabled>— Selecione —</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="tipo">Tipo</Label>
          <Select id="tipo" name="tipo" defaultValue={projeto?.tipo ?? "Residencial"}>
            {TIPOS_PROJETO.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="dataInicioPrev">Início previsto *</Label>
          <Input id="dataInicioPrev" name="dataInicioPrev" type="date" required defaultValue={paraInputDate(projeto?.dataInicioPrev ?? new Date())} />
        </div>
        <div>
          <Label htmlFor="dataFimPrev">Término previsto *</Label>
          <Input id="dataFimPrev" name="dataFimPrev" type="date" required defaultValue={paraInputDate(projeto?.dataFimPrev ?? new Date())} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue={projeto?.status ?? "PLANEJAMENTO"}>
            <option value="PLANEJAMENTO">Planejamento</option>
            <option value="EM_ANDAMENTO">Em andamento</option>
            <option value="PAUSADA">Pausada</option>
            <option value="CONCLUIDA">Concluída</option>
          </Select>
          <p className="mt-1 text-xs text-muted">“Atrasada” é automático pela data.</p>
        </div>
        <div>
          <Label htmlFor="areaM2">Área (m²)</Label>
          <Input id="areaM2" name="areaM2" type="number" step="0.01" min="0" defaultValue={projeto?.areaM2 ?? ""} />
        </div>
        <div>
          <Label htmlFor="valorContrato">Valor do contrato (R$)</Label>
          <Input id="valorContrato" name="valorContrato" type="number" step="0.01" min="0" defaultValue={projeto?.valorContrato ?? ""} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="responsavelId">Responsável</Label>
          <Select id="responsavelId" name="responsavelId" defaultValue={projeto?.responsavelId ?? ""}>
            <option value="">— Sem responsável —</option>
            {responsaveis.map((u) => (
              <option key={u.id} value={u.id}>{u.nome}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="endereco">Endereço da obra</Label>
          <Input id="endereco" name="endereco" defaultValue={projeto?.endereco ?? ""} />
        </div>
      </div>
      <div>
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea id="descricao" name="descricao" defaultValue={projeto?.descricao ?? ""} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={close}>Cancelar</Button>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  );
}
