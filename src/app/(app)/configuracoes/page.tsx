import { redirect } from "next/navigation";
import { Building2, Image as ImageIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { sessaoOrg } from "@/lib/sessao";
import { ehAdmin } from "@/lib/permissoes";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { salvarNomeOrg, salvarLogoOrg, removerLogoOrg } from "@/app/actions/organizacao";

export default async function ConfiguracoesPage() {
  const s = await sessaoOrg();
  if (!ehAdmin(s.papel)) redirect("/");

  const org = await prisma.organizacao.findUnique({ where: { id: s.organizacaoId } });
  if (!org) redirect("/");

  return (
    <div>
      <PageHeader titulo="Configurações" descricao="Identidade do seu escritório (aparece no menu, no topo e no login)." />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" /> Nome do escritório
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={salvarNomeOrg} className="flex flex-wrap items-end gap-3">
              <div className="flex-1">
                <Label htmlFor="nome">Nome</Label>
                <Input id="nome" name="nome" required defaultValue={org.nome} />
              </div>
              <Button type="submit">Salvar</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" /> Logo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-16 w-40 items-center justify-center rounded-lg border border-border bg-surface-muted">
                {org.logoData ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={org.logoData} alt="Logo atual" className="max-h-14 max-w-[150px] object-contain" />
                ) : (
                  <span className="text-xs text-muted">Sem logo</span>
                )}
              </div>
              <p className="text-sm text-muted">
                Substitui o ícone e o nome no app. PNG, JPG, WEBP ou SVG · máx. 400 KB · fundo transparente de preferência.
              </p>
            </div>
            <form action={salvarLogoOrg} className="flex flex-wrap items-center gap-3">
              <input
                type="file"
                name="logo"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                required
                className="block text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:opacity-90"
              />
              <Button type="submit">Enviar logo</Button>
            </form>
            {org.logoData && (
              <form action={removerLogoOrg}>
                <Button type="submit" variant="outline" size="sm">Remover logo</Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
