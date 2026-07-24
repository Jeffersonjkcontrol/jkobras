import { CalendarClock, Infinity as InfinityIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { DeleteButton } from "@/components/delete-button";
import { TrialForm } from "@/components/forms/trial-form";
import { alternarOrgAtiva, excluirOrg, definirTrial, tornarPermanente } from "@/app/actions/admin";
import { formatarData } from "@/lib/utils";
import { situacaoAcesso } from "@/lib/tenant";

export default async function AdminPage() {
  const orgs = await prisma.organizacao.findMany({
    orderBy: { criadoEm: "desc" },
    include: { _count: { select: { usuarios: true, projetos: true, clientes: true } } },
  });

  const situacoes = orgs.map((o) => situacaoAcesso(o));
  const emTeste = situacoes.filter((s) => s.dias !== null && s.dias >= 0 && s.label !== "Desativado").length;
  const expirados = situacoes.filter((s) => s.label === "Teste expirado").length;

  return (
    <div>
      <PageHeader
        titulo="Escritórios"
        descricao={`${orgs.length} escritório(s) na plataforma · ${emTeste} em teste · ${expirados} com teste expirado.`}
      />

      {orgs.length === 0 ? (
        <EmptyState titulo="Nenhum escritório cadastrado ainda" descricao="Novos escritórios aparecem aqui ao se cadastrarem em /cadastro." />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Escritório</TH>
              <TH>Slug</TH>
              <TH className="text-right">Usuários</TH>
              <TH className="text-right">Projetos</TH>
              <TH>Desde</TH>
              <TH>Acesso</TH>
              <TH className="text-right">Ações</TH>
            </tr>
          </THead>
          <tbody>
            {orgs.map((o, i) => {
              const sit = situacoes[i];
              return (
                <TR key={o.id}>
                  <TD className="font-medium">{o.nome}</TD>
                  <TD className="text-muted">{o.slug}</TD>
                  <TD className="text-right">{o._count.usuarios}</TD>
                  <TD className="text-right">{o._count.projetos}</TD>
                  <TD className="text-muted">{formatarData(o.criadoEm)}</TD>
                  <TD>
                    <Badge tone={sit.tone}>{sit.label}</Badge>
                    {o.trialAte && <span className="mt-0.5 block text-xs text-muted">até {formatarData(o.trialAte)}</span>}
                  </TD>
                  <TD>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Modal
                        title="Período de teste"
                        trigger={
                          <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-medium hover:bg-surface-muted">
                            <CalendarClock className="h-4 w-4" /> Teste
                          </span>
                        }
                      >
                        <TrialForm action={definirTrial} orgId={o.id} orgNome={o.nome} />
                      </Modal>

                      {o.trialAte && (
                        <form action={tornarPermanente}>
                          <input type="hidden" name="id" value={o.id} />
                          <Button type="submit" variant="outline" size="sm" title="Remover o prazo — tornar permanente">
                            <InfinityIcon className="h-4 w-4" />
                          </Button>
                        </form>
                      )}

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
              );
            })}
          </tbody>
        </Table>
      )}

      <p className="mt-4 text-xs text-muted">
        <strong>Teste</strong> define um prazo (7/15/30/60 dias ou uma data específica). Ao vencer, o escritório perde o
        acesso e vê um aviso — os dados continuam salvos. O botão de infinito remove o prazo e torna a conta permanente.
      </p>
    </div>
  );
}
