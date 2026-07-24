"use client";

import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useModalClose } from "@/components/ui/modal";

/** Super-admin define uma nova senha para um usuário de um escritório. */
export function RedefinirSenhaForm({
  action,
  userId,
  orgId,
  email,
}: {
  action: (formData: FormData) => void;
  userId: string;
  orgId: string;
  email: string;
}) {
  const close = useModalClose();
  return (
    <form action={action} onSubmit={() => setTimeout(close, 50)} className="space-y-4">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="orgId" value={orgId} />
      <p className="text-sm text-muted">
        Definindo nova senha para <strong className="text-foreground">{email}</strong>. Anote e repasse ao usuário.
      </p>
      <div>
        <Label htmlFor="novaSenha">Nova senha *</Label>
        <Input id="novaSenha" name="novaSenha" type="text" required minLength={6} placeholder="mín. 6 caracteres" />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={close}>Cancelar</Button>
        <Button type="submit">Redefinir</Button>
      </div>
    </form>
  );
}
