// Layout do portal do cliente: SEM autenticação (o acesso é pelo token do link).
// Cores explícitas (não usa os tokens de tema) para não herdar o modo escuro do
// aparelho de quem abre — o cliente nunca visitou o app e não escolheu tema.
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">{children}</div>
    </div>
  );
}
