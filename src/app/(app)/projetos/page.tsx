import Link from "next/link";
import { Plus, HardHat, ArrowRight, MapPin } from "lucide-react";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { podeEditar } from "@/lib/permissoes";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Filtros } from "@/components/ui/filtros";
import { Paginacao } from "@/components/ui/paginacao";
import { ProjetoForm } from "@/components/forms/projeto-form";
import { criarProjeto } from "@/app/actions/projetos";
import { formatarMoeda, formatarData } from "@/lib/utils";
import { statusCalculadoProjeto, STATUS_LABEL, STATUS_TONE } from "@/lib/projetos";
import { lerPagina, par, type SP } from "@/lib/listagem";

export default async function ProjetosPage({ searchParams }: { searchParams: Promise<SP> }) {
  const session = await auth();
  const editavel = podeEditar(session?.user.papel);

  const sp = await searchParams;
  const busca = par(sp, "busca");
  const { pagina, skip, take } = lerPagina(sp);
  const hoje = new Date();

  const where: Prisma.ProjetoWhereInput = busca
    ? {
        OR: [
          { titulo: { contains: busca, mode: "insensitive" } },
          { endereco: { contains: busca, mode: "insensitive" } },
          { cliente: { nome: { contains: busca, mode: "insensitive" } } },
        ],
      }
    : {};

  const [projetos, totalCount, clientes, responsaveis] = await Promise.all([
    prisma.projeto.findMany({
      where,
      orderBy: { criadoEm: "desc" },
      skip,
      take,
      include: { etapas: true, cliente: { select: { nome: true } } },
    }),
    prisma.projeto.count({ where }),
    prisma.cliente.findMany({ orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
    prisma.user.findMany({ where: { ativo: true }, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
  ]);

  const semClientes = clientes.length === 0;

  return (
    <div>
      <PageHeader
        titulo="Projetos"
        descricao="Obras e projetos de arquitetura."
        acao={
          editavel &&
          !semClientes && (
            <Modal
              title="Novo projeto"
              trigger={
                <span className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">
                  <Plus className="h-4 w-4" /> Novo projeto
                </span>
              }
            >
              <ProjetoForm action={criarProjeto} clientes={clientes} responsaveis={responsaveis} />
            </Modal>
          )
        }
      />

      {semClientes && (
        <div className="mb-4 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-foreground">
          Cadastre um <Link href="/clientes" className="font-medium text-primary hover:underline">cliente</Link> antes de criar um projeto.
        </div>
      )}

      <Filtros buscaDefault={busca ?? ""} placeholder="Buscar por projeto, cliente ou endereço…" />

      {totalCount === 0 ? (
        <EmptyState titulo={busca ? "Nenhum projeto encontrado" : "Nenhum projeto cadastrado"} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projetos.map((p) => {
            const status = statusCalculadoProjeto(p.status, p.dataInicioPrev, p.dataFimPrev, p.etapas, hoje);
            const progressoMedio =
              p.etapas.length > 0
                ? Math.round(p.etapas.reduce((s, e) => s + e.progresso, 0) / p.etapas.length)
                : 0;
            return (
              <Link key={p.id} href={`/projetos/${p.id}`} title="Abrir projeto" className="group block">
                <Card className="h-full transition-colors hover:border-primary">
                  <CardContent className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <HardHat className="h-5 w-5 text-muted" />
                        <span className="font-semibold text-foreground group-hover:text-primary">{p.titulo}</span>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                      </div>
                      <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>
                    </div>
                    <p className="text-xs text-muted">
                      {p.cliente.nome} · {p.tipo}
                      {p.endereco ? (
                        <span className="mt-0.5 flex items-center gap-1"><MapPin className="h-3 w-3" /> {p.endereco}</span>
                      ) : null}
                    </p>
                    <div>
                      <div className="mb-1 flex justify-between text-xs text-muted">
                        <span>Progresso</span>
                        <span>{progressoMedio}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                        <div className="h-full bg-primary" style={{ width: `${progressoMedio}%` }} />
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-muted">
                      <span>{formatarData(p.dataInicioPrev)}–{formatarData(p.dataFimPrev)}</span>
                      {p.valorContrato ? <span className="font-medium">{formatarMoeda(p.valorContrato)}</span> : null}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <Paginacao basePath="/projetos" sp={sp} pagina={pagina} total={totalCount} />
    </div>
  );
}
