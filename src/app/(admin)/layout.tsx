import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { auth } from "@/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { ehSuperAdmin } from "@/lib/permissoes";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!ehSuperAdmin(session.user.papel)) redirect("/");

  return (
    <div className="min-h-screen">
      <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="font-bold text-foreground">Obras Gestão · Painel</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <UserMenu nome={session.user.name ?? "Super Admin"} papelLabel="Super Admin" />
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-4 sm:p-6">{children}</main>
    </div>
  );
}
