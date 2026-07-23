"use client";

import { Input, Label, Textarea, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useModalClose } from "@/components/ui/modal";
import { FUNCOES, TIPO_CUSTO, TIPO_CUSTO_LABEL } from "@/lib/equipe";

type Profissional = {
  id: string;
  nome: string;
  funcao: string;
  tipoCusto: string;
  custoValor: number | null;
  telefone: string | null;
  cpf: string | null;
  email: string | null;
  endereco: string | null;
  contatoEmergencia: string | null;
  chavePix: string | null;
  observacoes: string | null;
  ativo: boolean;
};

export function ProfissionalForm({
  action,
  profissional,
}: {
  action: (formData: FormData) => void;
  profissional?: Profissional;
}) {
  const close = useModalClose();
  const p = profissional;
  return (
    <form action={action} onSubmit={() => setTimeout(close, 50)} className="space-y-4">
      {p && <input type="hidden" name="id" value={p.id} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="nome">Nome *</Label>
          <Input id="nome" name="nome" required defaultValue={p?.nome} placeholder="Ex.: José da Silva" />
        </div>
        <div>
          <Label htmlFor="funcao">Função *</Label>
          <Input id="funcao" name="funcao" required list="lista-funcoes" defaultValue={p?.funcao} placeholder="Ex.: Pedreiro" />
          <datalist id="lista-funcoes">
            {FUNCOES.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="tipoCusto">Forma de custo</Label>
          <Select id="tipoCusto" name="tipoCusto" defaultValue={p?.tipoCusto ?? "DIARIA"}>
            {TIPO_CUSTO.map((t) => (
              <option key={t} value={t}>{TIPO_CUSTO_LABEL[t]}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="custoValor">Valor (R$)</Label>
          <Input id="custoValor" name="custoValor" type="number" step="0.01" min="0" defaultValue={p?.custoValor ?? ""} placeholder="Ex.: 180" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="telefone">Telefone</Label>
          <Input id="telefone" name="telefone" defaultValue={p?.telefone ?? ""} placeholder="(19) 99999-0000" />
        </div>
        <div>
          <Label htmlFor="cpf">CPF</Label>
          <Input id="cpf" name="cpf" defaultValue={p?.cpf ?? ""} placeholder="000.000.000-00" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" defaultValue={p?.email ?? ""} />
        </div>
        <div>
          <Label htmlFor="chavePix">Chave PIX</Label>
          <Input id="chavePix" name="chavePix" defaultValue={p?.chavePix ?? ""} placeholder="CPF, telefone, e-mail…" />
        </div>
      </div>

      <div>
        <Label htmlFor="endereco">Endereço</Label>
        <Input id="endereco" name="endereco" defaultValue={p?.endereco ?? ""} />
      </div>
      <div>
        <Label htmlFor="contatoEmergencia">Contato de emergência</Label>
        <Input id="contatoEmergencia" name="contatoEmergencia" defaultValue={p?.contatoEmergencia ?? ""} placeholder="Nome e telefone" />
      </div>
      <div>
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea id="observacoes" name="observacoes" defaultValue={p?.observacoes ?? ""} />
      </div>

      {p && (
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" name="ativo" defaultChecked={p.ativo} className="h-4 w-4 rounded border-border" />
          Ativo (disponível para alocar em obras)
        </label>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={close}>Cancelar</Button>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  );
}
