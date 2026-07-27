import { redirect } from "next/navigation";
import Link from "next/link";
import { Activity, Users2, Building2, LogIn, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { ehSuperAdmin } from "@/lib/permissoes";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { formatarDataHora } from "@/lib/utils";

type Tone = "default" | "success" | "warning" | "danger";

/** Situação de uso do escritório a partir dos dias desde o último acesso. */
function situacaoUso(dias: number | null): { label: string; tone: Tone } {
  if (dias === null) return { label: "Nunca acessou", tone: "default" };
  if (dias <= 15) return { label: "Ativo", tone: "success" };
  return { label: `Parado há ${dias}d`, tone: dias > 30 ? "danger" : "warning" };
}

export default async function AdminUsoPage() {
  const session = await auth();
  if (!session?.user || !ehSuperAdmin(session.user.papel)) redirect("/");

  const agora = new Date();
  const hoje0 = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const d7 = new Date(agora.getTime() - 7 * 24 * 3600 * 1000);
  const soTenant = { organizacaoId: { not: null } };

  const [orgs, acessos7dGroup, timeline, acessosHoje, acessos7d, usuariosAtivos, escritoriosAtivos] = await Promise.all([
    prisma.organizacao.findMany({
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, usuarios: { select: { ultimoAcessoEm: true } } },
    }),
    prisma.acessoLog.groupBy({ by: ["organizacaoId"], where: { criadoEm: { gte: d7 }, ...soTenant }, _count: { _all: true } }),
    prisma.acessoLog.findMany({ where: soTenant, orderBy: { criadoEm: "desc" }, take: 40 }),
    prisma.acessoLog.count({ where: { criadoEm: { gte: hoje0 }, ...soTenant } }),
    prisma.acessoLog.count({ where: { criadoEm: { gte: d7 }, ...soTenant } }),
    prisma.acessoLog.groupBy({ by: ["userEmail"], where: { criadoEm: { gte: d7 }, ...soTenant } }),
    prisma.acessoLog.groupBy({ by: ["organizacaoId"], where: { criadoEm: { gte: d7 }, ...soTenant } }),
  ]);

  const acessos7dMap = new Map(acessos7dGroup.map((g) => [g.organizacaoId, g._count._all]));

  const linhas = orgs
    .map((o) => {
      const ultimo = o.usuarios
        .map((u) => u.ultimoAcessoEm)
        .filter((d): d is Date => !!d)
        .sort((a, b) => b.getTime() - a.getTime())[0];
      const dias = ultimo ? Math.floor((agora.getTime() - ultimo.getTime()) / 86400000) : null;
      const status = situacaoUso(dias);
      return { o, ultimo, acessos7d: acessos7dMap.get(o.id) ?? 0, status };
    })
    .sort((a, b) => (b.ultimo?.getTime() ?? 0) - (a.ultimo?.getTime() ?? 0));

  return (
    <div>
      <PageHeader titulo="Uso da plataforma" descricao="Quem está usando o JK Obras, e com que frequência." />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card><CardContent><p className="flex items-center gap-1 text-xs text-muted"><LogIn className="h-3.5 w-3.5" /> Acessos hoje</p><p className="mt-1 text-2xl font-bold">{acessosHoje}</p></CardContent></Card>
        <Card><CardContent><p className="flex items-center gap-1 text-xs text-muted"><Activity className="h-3.5 w-3.5" /> Acessos (7 dias)</p><p className="mt-1 text-2xl font-bold">{acessos7d}</p></CardContent></Card>
        <Card><CardContent><p className="flex items-center gap-1 text-xs text-muted"><Users2 className="h-3.5 w-3.5" /> Usuários ativos (7d)</p><p className="mt-1 text-2xl font-bold text-success">{usuariosAtivos.length}</p></CardContent></Card>
        <Card><CardContent><p className="flex items-center gap-1 text-xs text-muted"><Building2 className="h-3.5 w-3.5" /> Escritórios ativos (7d)</p><p className="mt-1 text-2xl font-bold text-primary">{escritoriosAtivos.length}</p></CardContent></Card>
      </div>

      {/* Por escritório */}
      <h2 className="mb-3 text-lg font-semibold text-foreground">Por escritório</h2>
      {linhas.length === 0 ? (
        <EmptyState titulo="Nenhum escritório ainda" />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Escritório</TH>
              <TH>Última atividade</TH>
              <TH className="text-right">Acessos (7d)</TH>
              <TH>Situação de uso</TH>
            </tr>
          </THead>
          <tbody>
            {linhas.map(({ o, ultimo, acessos7d, status }) => (
              <TR key={o.id}>
                <TD className="font-medium">
                  <Link href={`/admin/${o.id}`} className="hover:text-primary">{o.nome}</Link>
                </TD>
                <TD className="text-muted">{ultimo ? formatarDataHora(ultimo) : "nunca"}</TD>
                <TD className="text-right">{acessos7d}</TD>
                <TD><Badge tone={status.tone}>{status.label}</Badge></TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}

      {/* Linha do tempo */}
      <h2 className="mb-3 mt-8 flex items-center gap-2 text-lg font-semibold text-foreground"><Clock className="h-5 w-5 text-primary" /> Últimos acessos</h2>
      {timeline.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-surface p-6 text-center text-sm text-muted">
          Nenhum acesso registrado ainda. O histórico começa a partir de agora, conforme os usuários entram.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface text-sm">
          {timeline.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
              <span>
                <strong className="text-foreground">{a.userNome}</strong>
                <span className="text-muted"> · {a.orgNome ?? "—"}</span>
              </span>
              <span className="text-xs text-muted">
                {a.ip ? `${a.ip} · ` : ""}
                {formatarDataHora(a.criadoEm)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
