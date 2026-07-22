"use client";

import { Input, Label, Textarea, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useModalClose } from "@/components/ui/modal";

type Cliente = {
  id: string;
  nome: string;
  tipo: string;
  cpfCnpj: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  observacoes: string | null;
};

export function ClienteForm({
  action,
  cliente,
}: {
  action: (formData: FormData) => void;
  cliente?: Cliente;
}) {
  const close = useModalClose();
  return (
    <form action={action} onSubmit={() => setTimeout(close, 50)} className="space-y-4">
      {cliente && <input type="hidden" name="id" value={cliente.id} />}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Label htmlFor="nome">Nome *</Label>
          <Input id="nome" name="nome" required defaultValue={cliente?.nome} placeholder="Ex.: Família Silva" />
        </div>
        <div>
          <Label htmlFor="tipo">Tipo</Label>
          <Select id="tipo" name="tipo" defaultValue={cliente?.tipo ?? "PF"}>
            <option value="PF">Pessoa Física</option>
            <option value="PJ">Pessoa Jurídica</option>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="cpfCnpj">CPF / CNPJ</Label>
          <Input id="cpfCnpj" name="cpfCnpj" defaultValue={cliente?.cpfCnpj ?? ""} />
        </div>
        <div>
          <Label htmlFor="telefone">Telefone</Label>
          <Input id="telefone" name="telefone" defaultValue={cliente?.telefone ?? ""} />
        </div>
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" defaultValue={cliente?.email ?? ""} />
        </div>
      </div>
      <div>
        <Label htmlFor="endereco">Endereço</Label>
        <Input id="endereco" name="endereco" defaultValue={cliente?.endereco ?? ""} />
      </div>
      <div>
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea id="observacoes" name="observacoes" defaultValue={cliente?.observacoes ?? ""} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={close}>
          Cancelar
        </Button>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  );
}
