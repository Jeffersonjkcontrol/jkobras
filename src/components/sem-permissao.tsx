import { Lock } from "lucide-react";

/** Aviso padrão para áreas que o usuário não tem permissão de visualizar. */
export function SemPermissao({ area }: { area: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface px-6 py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted">
        <Lock className="h-6 w-6 text-muted" />
      </div>
      <p className="font-medium text-foreground">Acesso restrito</p>
      <p className="mt-1 max-w-sm text-sm text-muted">
        Você não tem permissão para ver {area}. Fale com o administrador do escritório se precisar deste acesso.
      </p>
    </div>
  );
}
