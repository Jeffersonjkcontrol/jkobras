import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/delete-button";
import { alternarOrgAtiva, excluirOrg } from "@/app/actions/admin";
import { formatarData } from "@/lib/utils";

export default async function AdminPage() {
  const orgs = await prisma.organizacao.findMany({
    orderBy: { criadoEm: "desc" },
    include: { _count: { select: { usuarios: true, projetos: true, clientes: true } } },
  });

  return (
    <div>
      <PageHeader titulo="Escritórios" descricao="Todos os escritórios (tenants) cadastrados na plataforma." />

      {orgs.length === 0 ? (
        <EmptyState titulo="Nenhum escritório cadastrado ainda" descricao="Novos escritórios aparecem aqui ao se cadastrarem em /cadastro." />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Escritório</TH>
              <TH>Slug</TH>
              <TH>Usuários</TH>
              <TH>Projetos</TH>
              <TH>Desde</TH>
              <TH>Situação</TH>
              <TH className="text-right">Ações</TH>
            </tr>
          </THead>
          <tbody>
            {orgs.map((o) => (
              <TR key={o.id}>
                <TD className="font-medium">{o.nome}</TD>
                <TD className="text-muted">{o.slug}</TD>
                <TD>{o._count.usuarios}</TD>
                <TD>{o._count.projetos}</TD>
                <TD>{formatarData(o.criadoEm)}</TD>
                <TD>{o.ativa ? <Badge tone="success">Ativo</Badge> : <Badge tone="danger">Desativado</Badge>}</TD>
                <TD>
                  <div className="flex items-center justify-end gap-2">
                    <form action={alternarOrgAtiva}>
                      <input type="hidden" name="id" value={o.id} />
                      <Button type="submit" variant="outline" size="sm">
                        {o.ativa ? "Desativar" : "Ativar"}
                      </Button>
                    </form>
                    <DeleteButton
                      action={excluirOrg}
                      id={o.id}
                      confirmacao={`Excluir o escritório "${o.nome}" e TODOS os dados dele? Esta ação não pode ser desfeita.`}
                    />
                  </div>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
