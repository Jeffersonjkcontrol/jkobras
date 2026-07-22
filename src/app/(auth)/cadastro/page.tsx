import Link from "next/link";
import { redirect } from "next/navigation";
import { HardHat } from "lucide-react";
import { auth } from "@/auth";
import { CadastroForm } from "@/components/forms/cadastro-form";

export default async function CadastroPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <HardHat className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Criar conta — Obras Gestão</h1>
          <p className="text-sm text-muted">Cadastre seu escritório e comece a usar</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <CadastroForm />
        </div>

        <p className="mt-4 text-center text-sm text-muted">
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
