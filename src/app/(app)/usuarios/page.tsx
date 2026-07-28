import { redirect } from "next/navigation";
import { Plus, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { sessaoOrg } from "@/lib/sessao";
import { ehAdmin, PAPEL_LABEL } from "@/lib/permissoes";
import { PageHeader } from "@/components/ui/page-header";
import { Modal } from "@/components/ui/modal";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/delete-button";
import { UsuarioForm } from "@/components/forms/usuario-form";
import { criarUsuario, atualizarUsuario, excluirUsuario } from "@/app/actions/usuarios";

type Flags = {
  papel: string;
  verFinanceiro: boolean;
  verOrcamentos: boolean;
  verCustosEquipe: boolean;
  verDocsRestritos: boolean;
};

/** Resumo do que o usuário enxerga — o admin bate o olho e entende. */
function ResumoPermissoes({ u }: { u: Flags }) {
  if (u.papel === "ADMIN") return <span className="text-xs text-muted">Tudo (administrador)</span>;

  const bloqueadas = [
    !u.verFinanceiro && "Financeiro",
    !u.verOrcamentos && "Orçamentos",
    !u.verCustosEquipe && "Custos da equipe",
    !u.verDocsRestritos && "Docs restritos",
  ].filter(Boolean) as string[];

  if (bloqueadas.length === 0) return <Badge tone="success">Tudo</Badge>;
  return (
    <span className="flex flex-wrap gap-1">
      {bloqueadas.map((b) => (
        <Badge key={b} tone="warning">sem {b}</Badge>
      ))}
    </span>
  );
}

export default async function UsuariosPage() {
  const s = await sessaoOrg();
  if (!ehAdmin(s.papel)) redirect("/");

  const usuarios = await prisma.user.findMany({
    where: { organizacaoId: s.organizacaoId },
    orderBy: { nome: "asc" },
  });

  return (
    <div>
      <PageHeader
        titulo="Usuários"
        descricao="Acessos e permissões."
        acao={
          <Modal
            title="Novo usuário"
            trigger={
              <span className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">
                <Plus className="h-4 w-4" /> Novo usuário
              </span>
            }
          >
            <UsuarioForm action={criarUsuario} />
          </Modal>
        }
      />

      <Table>
        <THead>
          <tr>
            <TH>Nome</TH>
            <TH>E-mail</TH>
            <TH>Papel</TH>
            <TH>Vê dados sigilosos</TH>
            <TH>Situação</TH>
            <TH className="text-right">Ações</TH>
          </tr>
        </THead>
        <tbody>
          {usuarios.map((u) => (
            <TR key={u.id}>
              <TD className="font-medium">{u.nome}</TD>
              <TD>{u.email}</TD>
              <TD>{PAPEL_LABEL[u.papel]}</TD>
              <TD><ResumoPermissoes u={u} /></TD>
              <TD>{u.ativo ? <Badge tone="success">Ativo</Badge> : <Badge tone="default">Inativo</Badge>}</TD>
              <TD>
                <div className="flex items-center justify-end gap-1">
                  <Modal
                    title="Editar usuário"
                    trigger={
                      <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-medium hover:bg-surface-muted">
                        <Pencil className="h-4 w-4" /> Editar
                      </span>
                    }
                  >
                    <UsuarioForm action={atualizarUsuario} usuario={u} />
                  </Modal>
                  {u.id !== s.userId && <DeleteButton action={excluirUsuario} id={u.id} />}
                </div>
              </TD>
            </TR>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
