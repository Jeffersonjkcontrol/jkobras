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
};

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
