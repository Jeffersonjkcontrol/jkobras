import Link from "next/link";
import { HardHat, AlertTriangle, ClipboardList, Contact, ArrowRight, type LucideIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { sessaoOrg } from "@/lib/sessao";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarrasSimples } from "@/components/charts";
import { formatarData } from "@/lib/utils";
import { statusCalculadoProjeto, etapaAtrasada, STATUS_LABEL, STATUS_TONE } from "@/lib/projetos";

function Kpi({ titulo, valor, icon: Icon, tone = "primary", href }: {
  titulo: string;
  valor: string | number;
  icon: LucideIcon;
  tone?: "primary" | "warning" | "danger" | "success";
  href?: string;
}) {
  const cores = {
    primary: "bg-primary/15 text-primary",
    warning: "bg-warning/15 text-warning",
    danger: "bg-danger/15 text-danger",
    success: "bg-success/15 text-success",
  };
  const conteudo = (
    <Card className={href ? "h-full transition-colors hover:border-primary" : undefined}>
      <CardContent className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${cores[tone]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted">{titulo}</p>
          <p className="text-2xl font-bold text-foreground">{valor}</p>
        </div>
        {href && <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted" />}
      </CardContent>
    </Card>
  );
  return href ? <Link href={href} className="block">{conteudo}</Link> : conteudo;
}

export default async function DashboardPage() {
  const s = await sessaoOrg();
  const org = s.organizacaoId;
  const hoje = new Date();
  const seteDiasAtras = new Date(hoje.getTime() - 7 * 24 * 3600 * 1000);

  const [projetos, nClientes, rdosSemana, rdosRecentes] = await Promise.all([
    prisma.projeto.findMany({ where: { organizacaoId: org }, include: { etapas: true, cliente: { select: { nome: true } } } }),
    prisma.cliente.count({ where: { organizacaoId: org } }),
    prisma.diarioObra.count({ where: { organizacaoId: org, data: { gte: seteDiasAtras } } }),
    prisma.diarioObra.findMany({
      where: { organizacaoId: org },
      orderBy: { data: "desc" },
      take: 6,
      include: {
        projeto: { select: { id: true, titulo: true } },
        criadoPor: { select: { nome: true } },
        itens: { select: { status: true } },
        _count: { select: { fotos: true } },
      },
    }),
  ]);

  const comStatus = projetos.map((p) => ({
    p,
    status: statusCalculadoProjeto(p.status, p.dataInicioPrev, p.dataFimPrev, p.etapas, hoje),
  }));
  const ativos = comStatus.filter((x) => x.status !== "CONCLUIDA").length;
  const etapasAtrasadas = projetos.flatMap((p) => p.etapas.filter((e) => etapaAtrasada(e, hoje))).length;

  const porStatus = ["PLANEJAMENTO", "EM_ANDAMENTO", "PAUSADA", "ATRASADA", "CONCLUIDA"].map((s) => ({
    nome: STATUS_LABEL[s],
    valor: comStatus.filter((x) => x.status === s).length,
    cor:
      s === "ATRASADA" ? "#dc2626" : s === "CONCLUIDA" ? "#16a34a" : s === "PAUSADA" ? "#d97706" : "#2563eb",
  }));

  const emAndamento = comStatus
    .filter((x) => x.status === "EM_ANDAMENTO" || x.status === "ATRASADA")
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Olá, {s.nome.split(" ")[0]} 👋</h1>
        <p className="text-sm text-muted">Visão geral das obras e projetos.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Kpi titulo="Projetos ativos" valor={ativos} icon={HardHat} href="/projetos" />
        <Kpi titulo="Etapas atrasadas" valor={etapasAtrasadas} icon={AlertTriangle} tone="danger" href="/projetos" />
        <Kpi titulo="RDOs (7 dias)" valor={rdosSemana} icon={ClipboardList} tone="success" href="#rdos-recentes" />
        <Kpi titulo="Clientes" valor={nClientes} icon={Contact} tone="warning" href="/clientes" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Projetos por situação</CardTitle></CardHeader>
          <CardContent><BarrasSimples dados={porStatus} /></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Em andamento</CardTitle></CardHeader>
          <CardContent>
            {emAndamento.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">Nenhum projeto em andamento.</p>
            ) : (
              <ul className="divide-y divide-border">
                {emAndamento.map(({ p, status }) => (
                  <li key={p.id}>
                    <Link href={`/projetos/${p.id}`} className="group flex items-center justify-between gap-3 py-3 hover:text-primary">
                      <div className="flex items-center gap-3">
                        <HardHat className="h-5 w-5 text-muted" />
                        <div>
                          <p className="font-medium text-foreground">{p.titulo}</p>
                          <p className="text-xs text-muted">{p.cliente.nome} · {formatarData(p.dataFimPrev)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>
                        <ArrowRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Diários de obra recentes — clicáveis, levam ao RDO do projeto */}
      <Card id="rdos-recentes" className="scroll-mt-6">
        <CardHeader><CardTitle>Diários de obra recentes (RDO)</CardTitle></CardHeader>
        <CardContent>
          {rdosRecentes.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">Nenhum RDO registrado ainda.</p>
          ) : (
            <ul className="divide-y divide-border">
              {rdosRecentes.map((r) => {
                const problema = r.itens.some((i) => i.status === "PROBLEMA");
                const atencao = r.itens.some((i) => i.status === "ATENCAO");
                return (
                  <li key={r.id}>
                    <Link href={`/projetos/${r.projeto.id}/rdo`} className="group flex items-center justify-between gap-3 py-3 hover:text-primary">
                      <div className="flex min-w-0 items-center gap-3">
                        <ClipboardList className="h-5 w-5 shrink-0 text-muted" />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{r.projeto.titulo}</p>
                          <p className="text-xs text-muted">
                            {formatarData(r.data)}
                            {r.criadoPor?.nome ? ` · ${r.criadoPor.nome}` : ""}
                            {r._count.fotos > 0 ? ` · ${r._count.fotos} foto(s)` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {problema ? (
                          <Badge tone="danger">Problema</Badge>
                        ) : atencao ? (
                          <Badge tone="warning">Atenção</Badge>
                        ) : (
                          <Badge tone="success">OK</Badge>
                        )}
                        <ArrowRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
