"use client";

import { useActionState } from "react";
import { UserPlus, Loader2 } from "lucide-react";
import { cadastrar, type CadastroState } from "@/app/actions/cadastro";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function CadastroForm() {
  const [state, action, pending] = useActionState<CadastroState, FormData>(cadastrar, undefined);
  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="escritorio">Nome do escritório</Label>
        <Input id="escritorio" name="escritorio" required placeholder="Ex.: Arq Studio" />
      </div>
      <div>
        <Label htmlFor="nome">Seu nome</Label>
        <Input id="nome" name="nome" required placeholder="Ex.: Ana Arquiteta" />
      </div>
      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div>
        <Label htmlFor="senha">Senha</Label>
        <Input id="senha" name="senha" type="password" required minLength={6} autoComplete="new-password" placeholder="mínimo 6 caracteres" />
      </div>

      {state?.erro && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{state.erro}</p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
        Criar conta do escritório
      </Button>
    </form>
  );
}
