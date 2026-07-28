"use client";

import { Input, Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useModalClose } from "@/components/ui/modal";

type Usuario = {
  id: string;
  nome: string;
  email: string;
  papel: string;
  ativo: boolean;
  recebeNotificacoes: boolean;
  verFinanceiro: boolean;
  verOrcamentos: boolean;
  verCustosEquipe: boolean;
  verDocsRestritos: boolean;
};

const AREAS: { name: string; label: string; descricao: string }[] = [
  { name: "verFinanceiro", label: "Financeiro e honorários", descricao: "Lançamentos, saldo, valor do contrato e valor/hora" },
  { name: "verOrcamentos", label: "Orçamentos", descricao: "Propostas e valores apresentados ao cliente" },
  { name: "verCustosEquipe", label: "Custos e dados da equipe", descricao: "CPF, PIX, telefone e quanto cada profissional recebe" },
  { name: "verDocsRestritos", label: "Documentos restritos", descricao: "Arquivos marcados como restritos (ex.: contratos)" },
];

export function UsuarioForm({
  action,
  usuario,
}: {
  action: (formData: FormData) => void;
  usuario?: Usuario;
}) {
  const close = useModalClose();
  const editando = Boolean(usuario);
  return (
    <form action={action} onSubmit={() => setTimeout(close, 50)} className="space-y-4">
      {usuario && <input type="hidden" name="id" value={usuario.id} />}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="nome">Nome *</Label>
          <Input id="nome" name="nome" required defaultValue={usuario?.nome} />
        </div>
        <div>
          <Label htmlFor="email">E-mail *</Label>
          <Input id="email" name="email" type="email" required defaultValue={usuario?.email} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="senha">{editando ? "Nova senha (deixe em branco p/ manter)" : "Senha *"}</Label>
          <Input id="senha" name="senha" type="password" autoComplete="new-password" required={!editando} placeholder={editando ? "••••••" : ""} />
        </div>
        <div>
          <Label htmlFor="papel">Papel</Label>
          <Select id="papel" name="papel" defaultValue={usuario?.papel ?? "USUARIO"}>
            <option value="ADMIN">Administrador</option>
            <option value="GESTOR">Gestor</option>
            <option value="USUARIO">Usuário</option>
          </Select>
        </div>
      </div>
      {/* Permissões de visualização: o papel acima define o que a pessoa pode
          EDITAR; estas caixas definem o que ela pode VER. */}
      <div className="border-t border-border pt-4">
        <p className="text-sm font-medium text-foreground">O que este usuário pode ver</p>
        <p className="mb-2 text-xs text-muted">
          Desmarque para esconder dados sigilosos. Administradores veem tudo, independentemente destas caixas.
        </p>
        <div className="space-y-2">
          {AREAS.map((a) => (
            <label key={a.name} className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border p-2.5 hover:bg-surface-muted">
              <input
                type="checkbox"
                name={a.name}
                defaultChecked={(usuario?.[a.name as keyof Usuario] as boolean) ?? true}
                className="mt-0.5 h-4 w-4 rounded border-border"
              />
              <span>
                <span className="block text-sm font-medium text-foreground">{a.label}</span>
                <span className="block text-xs text-muted">{a.descricao}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" name="recebeNotificacoes" defaultChecked={usuario?.recebeNotificacoes ?? false} /> Recebe notificações
      </label>
      {editando && (
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" name="ativo" defaultChecked={usuario?.ativo ?? true} /> Usuário ativo (pode entrar)
        </label>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={close}>Cancelar</Button>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  );
}
