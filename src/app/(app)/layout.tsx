import { redirect } from "next/navigation";
import { HardHat } from "lucide-react";
import { auth } from "@/auth";
import { Sidebar } from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { PAPEL_LABEL } from "@/lib/permissoes";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { name, papel } = session.user;

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-surface lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <HardHat className="h-5 w-5" />
          </div>
          <span className="font-bold text-foreground">Obras Gestão</span>
        </div>
        <Sidebar papel={papel} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
          <div className="flex items-center gap-2 lg:hidden">
            <HardHat className="h-5 w-5 text-primary" />
            <span className="font-bold text-foreground">Obras Gestão</span>
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <UserMenu nome={name ?? "Usuário"} papelLabel={PAPEL_LABEL[papel]} />
          </div>
        </header>

        <div className="border-b border-border bg-surface lg:hidden">
          <Sidebar papel={papel} />
        </div>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
