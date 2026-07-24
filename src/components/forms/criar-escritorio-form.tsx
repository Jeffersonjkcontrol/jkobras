"use client";

import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useModalClose } from "@/components/ui/modal";

/** Super-admin cria um escritório + o usuário administrador dele. */
export function CriarEscritorioForm({ action }: { action: (formData: FormData) => void }) {
  const close = useModalClose();
  return (
    <form action={action} onSubmit={() => setTimeout(close, 50)} className="space-y-4">
      <div>
        <Label htmlFor="escritorio">Nome do escritório *</Label>
        <Input id="escritorio" name="escritorio" required placeholder="Ex.: Arq Studio" />
      </div>
      <div className="border-t border-border pt-4">
        <p className="mb-3 text-sm font-medium text-foreground">Administrador do escritório</p>
        <div className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome do responsável *</Label>
            <Input id="nome" name="nome" required placeholder="Ex.: Maria Arquiteta" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="email">E-mail *</Label>
              <Input id="email" name="email" type="email" required placeholder="admin@escritorio.com" />
            </div>
            <div>
              <Label htmlFor="senha">Senha inicial *</Label>
              <Input id="senha" name="senha" type="text" required minLength={6} placeholder="mín. 6 caracteres" />
            </div>
          </div>
          <p className="text-xs text-muted">Passe esta senha ao responsável — ele pode trocá-la depois.</p>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={close}>Cancelar</Button>
        <Button type="submit">Criar escritório</Button>
      </div>
    </form>
  );
}
