"use client";

import { Input, Label, Textarea, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useModalClose } from "@/components/ui/modal";
import { paraInputDate } from "@/lib/utils";
import { ORGAOS, STATUS_APROVACAO, STATUS_APROVACAO_LABEL } from "@/lib/arquitetura";

type Opcao = { id: string; nome: string };
type Aprovacao = {
  id: string;
  orgao: string;
  descricao: string;
  numeroProtocolo: string | null;
  dataProtocolo: Date | null;
  prazo: Date | null;
  status: string;
  responsavelId: string | null;
  observacoes: string | null;
};

export function AprovacaoForm({
  action,
  projetoId,
  responsaveis,
  aprovacao,
}: {
  action: (formData: FormData) => void;
  projetoId: string;
  responsaveis: Opcao[];
  aprovacao?: Aprovacao;
}) {
  const close = useModalClose();
  const a = aprovacao;
  return (
    <form action={action} onSubmit={() => setTimeout(close, 50)} className="space-y-4">
      <input type="hidden" name="projetoId" value={projetoId} />
      {a && <input type="hidden" name="id" value={a.id} />}

      <div>
        <Label htmlFor="descricao">O que está sendo aprovado *</Label>
        <Input id="descricao" name="descricao" required defaultValue={a?.descricao} placeholder="Ex.: Aprovação do projeto legal" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="orgao">Órgão *</Label>
          <Input id="orgao" name="orgao" required list="lista-orgaos" defaultValue={a?.orgao} placeholder="Ex.: Prefeitura Municipal" />
          <datalist id="lista-orgaos">
            {ORGAOS.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
        </div>
        <div>
          <Label htmlFor="status">Situação *</Label>
          <Select id="status" name="status" defaultValue={a?.status ?? "PREPARACAO"}>
            {STATUS_APROVACAO.map((st) => (
              <option key={st} value={st}>{STATUS_APROVACAO_LABEL[st]}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="numeroProtocolo">Nº do protocolo</Label>
          <Input id="numeroProtocolo" name="numeroProtocolo" defaultValue={a?.numeroProtocolo ?? ""} />
        </div>
        <div>
          <Label htmlFor="dataProtocolo">Data do protocolo</Label>
          <Input id="dataProtocolo" name="dataProtocolo" type="date" defaultValue={a?.dataProtocolo ? paraInputDate(a.dataProtocolo) : ""} />
        </div>
        <div>
          <Label htmlFor="prazo">Prazo</Label>
          <Input id="prazo" name="prazo" type="date" defaultValue={a?.prazo ? paraInputDate(a.prazo) : ""} />
          <p className="mt-1 text-xs text-muted">Alerta se vencer sem aprovação.</p>
        </div>
      </div>

      <div>
        <Label htmlFor="responsavelId">Responsável</Label>
        <Select id="responsavelId" name="responsavelId" defaultValue={a?.responsavelId ?? ""}>
          <option value="">— Sem responsável —</option>
          {responsaveis.map((r) => (
            <option key={r.id} value={r.id}>{r.nome}</option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea id="observacoes" name="observacoes" defaultValue={a?.observacoes ?? ""} placeholder="Exigências recebidas, pendências, contatos…" />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={close}>Cancelar</Button>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  );
}
