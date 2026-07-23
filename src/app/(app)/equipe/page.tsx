import Link from "next/link";
import { Plus, Users, ArrowRight, Phone } from "lucide-react";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sessaoOrg } from "@/lib/sessao";
import { podeEditar } from "@/lib/permissoes";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Filtros } from "@/components/ui/filtros";
import { Paginacao } from "@/components/ui/paginacao";
import { ProfissionalForm } from "@/components/forms/profissional-form";
import { criarProfissional } from "@/app/actions/equipe";
import { formatarCusto } from "@/lib/equipe";
import { lerPagina, par, type SP } from "@/lib/listagem";

export default async function EquipePage({ searchParams }: { searchParams: Promise<SP> }) {
  const s = await sessaoOrg();
  const org = s.organizacaoId;
  const editavel = podeEditar(s.papel);

  const sp = await searchParams;
  const busca = par(sp, "busca");
  const { pagina, skip, take } = lerPagina(sp);

  const where: Prisma.ProfissionalWhereInput = {
    organizacaoId: org,
    ...(busca
      ? {
          OR: [
            { nome: { contains: busca, mode: "insensitive" } },
            { funcao: { contains: busca, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [profissionais, totalCount] = await Promise.all([
    prisma.profissional.findMany({
      where,
      orderBy: [{ ativo: "desc" }, { nome: "asc" }],
      skip,
      take,
      include: { _count: { select: { alocacoes: true } } },
    }),
    prisma.profissional.count({ where }),
  ]);

  return (
    <div>
      <PageHeader
        titulo="Equipe"
        descricao="Profissionais da obra — empreiteiros, pedreiros, encanadores, eletricistas…"
        acao={
          editavel && (
            <Modal
              title="Novo profissional"
              trigger={
                <span className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">
                  <Plus className="h-4 w-4" /> Novo profissional
                </span>
              }
            >
              <ProfissionalForm action={criarProfissional} />
            </Modal>
          )
        }
      />

      <Filtros buscaDefault={busca ?? ""} placeholder="Buscar por nome ou função…" />

      {totalCount === 0 ? (
        <EmptyState
          titulo={busca ? "Nenhum profissional encontrado" : "Nenhum profissional cadastrado"}
          descricao="Cadastre a equipe uma vez e aloque em quantas obras precisar."
        />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Nome</TH>
              <TH>Função</TH>
              <TH className="text-right">Custo</TH>
              <TH>Telefone</TH>
              <TH className="text-right">Obras</TH>
              <TH></TH>
              <TH className="text-right">Ação</TH>
            </tr>
          </THead>
          <tbody>
            {profissionais.map((p) => (
              <TR key={p.id}>
                <TD className="font-medium">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted" /> {p.nome}
                  </span>
                </TD>
                <TD className="text-muted">{p.funcao}</TD>
                <TD className="text-right whitespace-nowrap">{formatarCusto(p.tipoCusto, p.custoValor)}</TD>
                <TD className="text-muted">
                  {p.telefone ? (
                    <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {p.telefone}</span>
                  ) : "—"}
                </TD>
                <TD className="text-right">{p._count.alocacoes}</TD>
                <TD>{!p.ativo && <Badge tone="default">Inativo</Badge>}</TD>
                <TD className="text-right">
                  <Link href={`/equipe/${p.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                    Abrir <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}

      <Paginacao basePath="/equipe" sp={sp} pagina={pagina} total={totalCount} />
    </div>
  );
}
