import { redirect } from "next/navigation";
import { auth } from "@/auth";

/** Layout dos relatórios: sem menu/sidebar e sempre em fundo claro,
 *  para o resultado impresso (ou salvo em PDF) sair legível. */
export default async function PrintLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen bg-neutral-100 py-6 text-neutral-900 print:bg-white print:py-0">
      <div className="mx-auto max-w-[210mm] bg-white p-8 shadow-sm print:max-w-none print:p-0 print:shadow-none">
        {children}
      </div>
    </div>
  );
}
