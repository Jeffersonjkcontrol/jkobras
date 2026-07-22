import Link from "next/link";
import { Plus, Pencil, Contact, ArrowRight } from "lucide-react";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { podeEditar } from "@/lib/permissoes";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { Modal } from "@/components/ui/modal";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { Filtros } from "@/components/ui/filtros";
import { Paginacao } from "@/components/ui/paginacao";
import { DeleteButton } from "@/components/delete-button";
import { ClienteForm } from "@/components/forms/cliente-form";
import { criarCliente, atualizarCliente, excluirCliente } from "@/app/actions/clientes";
import { lerPagina, par, type SP } from "@/lib/listagem";

export default async function ClientesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const session = await auth();
  const editavel = podeEditar(session?.user.papel);

  const sp = await searchParams;
  const busca = par(sp, "busca");
  const { pagina, skip, take } = lerPagina(sp);

  const where: Prisma.ClienteWhereInput = busca
    ? {
        OR: [
          { nome: { contains: busca, mode: "insensitive" } },
          { cpfCnpj: { contains: busca, mode: "insensitive" } },
          { email: { contains: busca, mode: "insensitive" } },
        ],
      }
    : {};

  const [clientes, totalCount] = await Promise.all([
    prisma.cliente.findMany({
      where,
      orderBy: { nome: "asc" },
      skip,
      take,
      include: { _count: { select: { projetos: true } } },
    }),
    prisma.cliente.count({ where }),
  ]);

  return (
    <div>
      <PageHeader
        titulo="Clientes"
        descricao="Contratantes dos projetos e obras."
        acao={
          editavel && (
            <Modal
              title="Novo cliente"
              trigger={
                <span className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">
                  <Plus className="h-4 w-4" /> Novo cliente
                </span>
              }
            >
              <ClienteForm action={criarCliente} />
            </Modal>
          )
        }
      />

      <Filtros buscaDefault={busca ?? ""} placeholder="Buscar por nome, CPF/CNPJ ou e-mail…" />

      {totalCount === 0 ? (
        <EmptyState titulo={busca ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"} />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Cliente</TH>
              <TH>Tipo</TH>
              <TH>Telefone</TH>
              <TH>Projetos</TH>
              {editavel && <TH className="text-right">Ações</TH>}
            </tr>
          </THead>
          <tbody>
            {clientes.map((c) => (
              <TR key={c.id}>
                <TD>
                  <Link
                    href={`/clientes/${c.id}`}
                    title="Abrir cliente"
                    className="group flex items-center gap-2 font-medium hover:text-primary"
                  >
                    <Contact className="h-4 w-4 text-muted" />
                    {c.nome}
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </Link>
                </TD>
                <TD>{c.tipo === "PJ" ? "Pessoa Jurídica" : "Pessoa Física"}</TD>
                <TD>{c.telefone ?? "—"}</TD>
                <TD>{c._count.projetos}</TD>
                {editavel && (
                  <TD>
                    <div className="flex items-center justify-end gap-1">
                      <Modal
                        title="Editar cliente"
                        trigger={
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-surface-muted">
                            <Pencil className="h-4 w-4" />
                          </span>
                        }
                      >
                        <ClienteForm action={atualizarCliente} cliente={c} />
                      </Modal>
                      <DeleteButton action={excluirCliente} id={c.id} />
                    </div>
                  </TD>
                )}
              </TR>
            ))}
          </tbody>
        </Table>
      )}

      <Paginacao basePath="/clientes" sp={sp} pagina={pagina} total={totalCount} />
    </div>
  );
}
