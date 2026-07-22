import { redirect } from "next/navigation";
import { HardHat } from "lucide-react";
import { auth } from "@/auth";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <HardHat className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Obras Gestão</h1>
          <p className="text-sm text-muted">Acesse com suas credenciais</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <LoginForm />
        </div>

        <p className="mt-4 text-center text-xs text-muted">
          Não tem acesso? Solicite ao administrador.
        </p>
      </div>
    </div>
  );
}
